'use strict';
const Deals = require('../models/Deals');
const Orders = require('../models/Orders');
const Customers = require('../models/Customers');
const OTPService = require('../services/OTPService');
const SlackService = require('../services/SlackService');
// const OmiseService = require('../services/OmiseService');
const EmailService = require('../services/EmailService');
const Boom = require('boom');
const controller = {};

// GET: api/orders Filter orders by provider {default}, if shop id given then filter orders by shop
controller.getOrders = function (request, reply) {
  let mongoFilter = {};
  const limit = request.query.limit || 30;
  const skip = (request.query.page || 0) * limit;
  if (request.role === 'PROVIDER') {
    mongoFilter.provider = request.providerId;
    if (request.query.shop) {  // if shop id provided in query string then filter orders by shop
      mongoFilter.shop = request.query.shop;
    }
  } else if (request.role === 'SHOP_ADMIN' && request.shop) {
    mongoFilter.shop = request.shop;
  } else {
    return reply(Boom.unauthorized());
  }
  // otherwise filter orders by provider
  Orders
    .find(mongoFilter)
    .populate('shop',['name'])
    .populate('customer',['name', 'phone'])
    .populate('deal',['name','description'])
    .limit(limit)
    .skip(skip)
    .then((orders) => {
      if (!orders) {
        return reply(Boom.notFound(request.i18n.__('404_ORDER')));
      }
      Orders.count(mongoFilter).exec().then((total) => {
        return reply({data: orders, paging: { total }});
      })
        .catch(() => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
};
// GET: api/orders{id} Filter orders by id & provider {default}, if shop id given then filter orders by id & shop
controller.getOrderById = function (request, reply) {
  if (request.role === 'PROVIDER') {
    let mongoFilter = {_id: request.params.id, provider: request.providerId };
    if (request.query.shop) {  // if shop id provided in query string then filter orders by shop
      mongoFilter.shop = request.query.shop;
    }
    // otherwise filter orders by provider
    Orders
    .findOne(mongoFilter)
    .then((order) => {
      if (!order) {
        return reply(Boom.notFound(request.i18n.__('404_ORDER')));
      }
      return reply(order);
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};
// POST: api/orders/
controller.create = function (request, reply) {
  if (request.role === 'CUSTOMER') {
    const shop = request.payload.shop;
    const deal = request.payload.deal;
    const payment_method = request.payload.payment_method;
    const booking_date = request.payload.booking_date;
    const people_allow = request.payload.people_allow || 1;
    const slot_id = request.payload.slot; //id of the slot
    const obj = {};
    // const card_token = request.payload.card_token || '';
    // const card_id = request.payload.card_id || '';
    Deals
      .findOne({_id: deal, shop})
      .populate('shop', ['provider', 'name'])
      .exec()
      .then((Deal) => {
        let slotIndex = -1;
        const slot = Deal.availability.slots.filter((slotObj, index) => {
          if (slotObj._id == slot_id) {
            slotIndex = index;
          }
          return slotObj._id == slot_id;
        })[0];
        if (!slot) {
          return reply(Boom.notFound(request.i18n.__('404_SLOT')));
        }
        if (slot.seats < 1) {
          return reply({error: true, message: request.i18n.__('200_SLOT_SEATS')});
        }

        // decrease the amount of seat by 1 in slot
        slot.seats_available = slot.seats_available - 1;
        Deal.availability.slots[slotIndex] = slot;
        Deal.markModified(`availability.slots.${slotIndex}`);
        const start = slot.start%60 === 0 ? '00' : slot.start%60;
        const end = slot.stop%60 === 0 ? '00' : slot.stop%60;
        const Order = new Orders(request.payload);
        Order.shop = shop;
        Order.deal = deal;
        Order.slot = {
          start: slot.start,
          stop: slot.stop,
          price: slot.price
        };
        Order.payment_method = payment_method;
        Order.provider = Deal.shop && Deal.shop.provider;
        Order.customer = request.customerId;
        Order.booking_date = booking_date;
        Order.original_price = Deal.original_price;
        Order.final_price = slot.price*people_allow;
        Order.people_allow = people_allow;
        Order.status = 'ORDERED';
        Order.created_by = request.user;
        Order.updated_by = request.user;
        obj.price = slot.price*people_allow;
        obj.time_slot = slot.start + '-' + slot.stop;
        obj.time_slot = parseInt(slot.start/60) + ':' + start + '-' + parseInt(slot.stop/60) + ':' + end + 'h';
        obj.booking_creation_date = new Date();
        obj.deal_name = Deal.name.en;
        obj.shop_name = Deal.shop.name.en;
        obj.people_allow = people_allow;
        obj.booking_date = booking_date;
        Order
          .save()
          .then((order) => {
            Deal.save(function (err, result) {
              if (!err) {
                Customers.findOne({_id: request.customerId}).then((Customer) => {
                  Customer.notifications = Customer.notifications || [];
                  Customer.notifications.push({
                    title: {
                      en: 'Order created',
                      th: 'Order created' 
                    },
                    detail: {
                      en: `Your order #${order.order_id} was created successfully`,
                      th:  `Your order #${order.order_id} was created successfully`
                    },
                    type: 'ORDER',
                    entity_id: order._id,
                    timestamp: new Date().toISOString()
                  });
                  obj.name = Customer.name;
                  obj.phone = Customer.phone;
                  obj.order_id = order.order_id;
                  Customers.update({_id: request.customerId}, Customer, (err, customer) => {
                    if (err) {
                      return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
                    }
                    // if (Customer.omise_customer_id && payment_method === 'CARD') {
                    //   OmiseService.doPaymentWithSavedCard(card_id, Customer.omise_customer_id ,slot.price, order.order_id)
                    //   .then((succ) => {
                    //     return reply({success: true, order_id: order._id, order_no: order.order_id});
                    //   })
                    //   .catch((err) => {
                    //     Order.remove();
                    //     if (err.code) {
                    //       const errMessageCode = OmiseService.errorMessage(err.code);
                    //       return reply(Boom.internal(request.i18n.__(errMessageCode)));
                    //     }
                    //     return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
                    //   });
                    // } else if (payment_method === 'CARD') {
                    //   OmiseService.doPaymentWithCardToken(card_token, slot.price, order.order_id)
                    //   .then((succ) => {
                    //     return reply({success: true, order_id: order._id, order_no: order.order_id});
                    //   })
                    //   .catch((err) => {
                    //     Order.remove();
                    //     if (err.code) {
                    //       const errMessageCode = OmiseService.errorMessage(err.code);
                    //       return reply(Boom.internal(request.i18n.__(errMessageCode)));
                    //     }
                    //     return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
                    //   });
                    // } else {
                    //   return reply({success: true, order_id: order._id, order_no: order.order_id});
                    // }
                    const message = `Thank you for your order. Your order #${order.order_id} was created successfully.`;
                    EmailService.sendMail(obj, 'info@indulgee.com', 'create_order').then(() => {
                      const messagePayload = SlackService.createCancelOrderTemplate(obj, 'Created');
                      SlackService.createCancelOrder(messagePayload);
                      OTPService.sendSMS(message, Customer.phone).then(() => {
                        return reply({success: true, order_id: order._id, order_no: order.order_id});
                      }).catch((err) => {
                        OTPService.sendSMS(message, Customer.phone).catch((err) => {
                          return reply({success: true, order_id: order._id, order_no: order.order_id});
                        });
                      });
                    })
                    .catch((error) => {
                      console.log(error);
                      Order.remove();
                      return reply(Boom.internal());
                    });
                  });
                })
                .catch((err) => {
                  Order.remove();
                  return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
                });
              } else {
                Order.remove();
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              }
            });
          })
          .catch((err) => {
            return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
          });
      })
      .catch((error) => {
        return reply(Boom.notFound(request.i18n.__('404_DEAL')));
      });
  } else {
    return reply(Boom.unauthorized());
  }
};
// PUT: api/orders/{id}/cancel for customers
// PUT: api/orders/{id}  for admin
controller.update = function (request, reply) {
  const orderId = request.params.id;
  const locale = request.i18n && request.i18n.locale;
  if (request.role === 'CUSTOMER') {
    const customerId = request.customerId;
    Orders
    .findOne({_id: orderId, customer: request.customerId})
    .populate('shop', 'name')
    .populate('deal', 'name')
    .then((order) => {
      if (!order) return reply(Boom.notFound(request.i18n.__('404_ORDER')));
      const date = new Date();
      const message = `You cancelled your order #${order.order_id} on ${date.toUTCString()} with ${order.shop && order.shop.name[locale]}`;
      const doc = {
        status: 'CANCELED',
        updated_at: new Date(),
        updated_by: request.user
      };
      Orders
        .update({_id: request.params.id}, doc, (err, deal) => {
          if (err) {
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          }
          Customers.findOne({_id: customerId}).then((Customer) => {
            if (!Customer) {
              return reply(Boom.notFound('Order updated successfully but saving notification returned in customer not found'));
            }
            let notifications = Customer.notifications || [];
            notifications.push({
              title: {
                en: `You canceled your order`,
                th: `You canceled your order`
              },
              detail: {
                en: `Your order #${order.order_id} was successfully canceled`,
                th: `Your order #${order.order_id} was successfully canceled`
              },
              entity_id: order._id,
              type: 'ORDER',
              timestamp: new Date().toISOString()
            });
            const doc = {
              notifications,
              updated_at: new Date(),
              updated_by: request.user
            };
            Customers.update({_id: Customer._id}, doc, (err, customer) => {
              if (err) {
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              }
              const number = Customer && Customer.phone;
              const start = order.slot.start%60 === 0 ? '00' : order.slot.start%60;
              const end = order.slot.stop%60 === 0 ? '00' : order.slot.stop%60;
              const obj = {
                order_id: order.order_id,
                name: Customer.name,
                phone: Customer.phone,
                deal_name: order.deal && order.deal.name.en,
                shop_name: order.shop && order.shop.name.en,
                price: order.final_price,
                people_allow: order.people_allow,
                time_slot: '',
                booking_creation_date: order.created_at,
                booking_date: order.booking_date
              };
              obj.time_slot = parseInt(order.slot.start/60) + ':' + start + '-' + parseInt(order.slot.stop/60) + ':' + end + 'h';
              EmailService.sendMail(obj, 'info@indulgee.com', 'cancel_order').then(() => {
                const messagePayload = SlackService.createCancelOrderTemplate(obj, 'Canceled');
                SlackService.createCancelOrder(messagePayload);
                OTPService.sendSMS(message, number).then(() => {
                  return reply({success: true, message: request.i18n.__('200_ORDER_UPDATED')});
                }).catch((err) => {
                  OTPService.sendSMS(message, number).catch((err) => {
                    console.log('Something went wrong while sending sms');
                  });
                  return reply({success: true, message: request.i18n.__('200_ORDER_UPDATED')});
                });
              }).catch((err) => {
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              });
            });
          });
        });
    })
    .catch(() => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  } else if (request.role === 'PROVIDER' || request.role === 'SHOP_ADMIN') {
    let findOrderFilter = {_id: orderId};
    if (request.role === 'PROVIDER') {
      findOrderFilter.provider = request.providerId;
    }
    if (request.role === 'SHOP_ADMIN' && request.shop) {
      findOrderFilter.shop = request.shop;
    }
    Orders
    .findOne(findOrderFilter)
    .populate('shop', 'name')
    .then((order) => {
      if (!order) return reply(Boom.notFound(request.i18n.__('404_ORDER')));
      const doc = {
        status: request.payload.status,
        updated_at: new Date(),
        updated_by: request.user
      }
      let message = '';
      const status = request.payload.status;
      const date = new Date();
      if (status === 'CANCELED') {
        message = `Your order #${order.order_id} on ${date.toUTCString()} was canceled by the ${order.shop && order.shop.name[locale]}`;
      } else if (status === 'CONFIRMED') {
        message = `Your order #${order.order_id} on ${date.toUTCString()} with ${order.shop && order.shop.name[locale]} is now confirmed`;
      }
      Orders
        .update({_id: request.params.id}, doc, (err, deal) => {
          if (err) {
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          }
          Customers.findOne({_id: order.customer}).then((Customer) => {
            if (!Customer) {
              return reply(Boom.notFound(request.i18n.__('404_CUSTOMER')));
            }
            let notifications = Customer.notifications || [];
            notifications.push({
              title: {
                en: `Order ${request.payload.status.toLowerCase()}`,
                th: `Order ${request.payload.status.toLowerCase()}`
              },
              detail: {
                en: `Your order #${order.order_id} was successfully ${request.payload.status.toLowerCase()}`,
                th: `Your order #${order.order_id} was successfully ${request.payload.status.toLowerCase()}`
              },
              entity_id: order._id,
              type: 'ORDER',
              timestamp: new Date().toISOString()
            });
            const doc = {
              notifications,
              updated_at: new Date(),
              updated_by: request.user
            }
            Customers.update({_id: Customer._id}, doc, (err, customer) => {
              if (err) {
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              }
              if (status === 'CONFIRMED' || status === 'CANCELED') {
                const number = Customer && Customer.phone;
                OTPService.sendSMS(message, number ).then(() => {
                  return reply({success: true, message: request.i18n.__('200_ORDER_UPDATED')});
                }).catch((err) => {
                  OTPService.sendSMS(message, number).catch((err) => {
                    console.log('something went wrong while sending sms');
                  });
                  return reply({success: true, message: request.i18n.__('200_ORDER_UPDATED')});
                });
              } else {
                return reply({success: true, message: request.i18n.__('200_ORDER_UPDATED')});
              }
            });
          });
        });
    })
    .catch((error) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};

module.exports = controller;
