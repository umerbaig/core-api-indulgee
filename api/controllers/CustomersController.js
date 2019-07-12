'use strict';
const Customers = require('../models/Customers');
const Deals = require('../models/Deals');
const Orders = require('../models/Orders');
const Shops = require('../models/Shops');
const Users = require('../models/Users');
const ObjectId = require('mongodb').ObjectId;
const OTPService = require('../services/OTPService');
const OmiseService = require('../services/OmiseService');
const Boom = require('boom');
const controller = {};

// GET /customers

controller.getAll = function (request, reply) {
  if (request.role == 'PROVIDER') {
    const limit = request.query.limit || 30;
    const skip = (request.query.page || 0) * limit;
    Customers
      .find()
      .limit(limit)
      .skip(skip)
      .exec()
      .then((customers) => {
        Customers.count().exec().then((total) => {
          return reply({data: customers, paging: { total }});
        })
        .catch(() => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  } else if (request.role == 'CUSTOMER') {
    Customers
      .findOne({_id: request.customerId})
      .exec()
      .then((customer) => {
        return reply(customer);
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  } else {
    return reply(Boom.unauthorized());
  }

}
// GET: /customers/settings  get customer by id
controller.getCustomer = function (request, reply) {
  if (request.role != 'CUSTOMER') {
    return reply(Boom.unauthorized());
  }
  Customers.findOne({_id: request.customerId}).select('name email phone sms push_notifications').then((customer) => {
    if (!customer) {
      return reply(Boom.notFound(request.i18n.__('404_CUSTOMER')));
    }
    return reply(customer);
  }).catch((err) => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  });
}
// PUT: /customers/settings update customer data
controller.updateCustomer = function (request, reply) {
  if (request.role != 'CUSTOMER') {
    return reply(Boom.unauthorized());
  }
  const findObj = {_id: request.customerId};
  const doc = request.payload;
  Customers.update(findObj, doc, (err, customer) => {
    if (err) {
      return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
    }
    return reply({success: true, message: request.i18n.__('200_CUSTOMER_UPDATED')});
  });
}
// POST: /customers/update_phone update customers phone number
controller.updatePhone = function (request, reply) {
  const code = request.payload.code;
  const phone = request.payload.phone_number;
  if (request.role != 'CUSTOMER') {
    return reply(Boom.unauthorized());
  }
  Users.findOne({_id: request.user}).then((User) => {
    if (!User) {
      return reply(Boom.notFound());
    }
    OTPService
      .verifyCode(phone, 'CHANGE_PHONE', code)
      .then((phoneCodeObj) => {
        Users
          .update({_id: User._id}, {phone}, (err, res) => {
            if (err) {
              return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
            }
            Customers.update({_id: User.customer}, {phone}, (err, res) => {
              if (err) {
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              }
              reply({success: true, message: request.i18n.__('200_PHONE_UPDATED')});
            });
          });
      }).catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  }).catch((err) => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  });
};

controller.unreadNotificationsCount = function (request, reply) {
  if (request.role != 'CUSTOMER') {
    return reply(Boom.unauthorized());
  }
  const customerId = request.customerId;

  Customers.aggregate([
    {
      $match: {
        _id: ObjectId(customerId)
      }
    },
    {
      $unwind: '$notifications'
    },
    {
      $match: {
        'notifications.un_read': true
      }
    },
    {
      $count: 'notifications_count'
    }
  ])
  .then((res) => {
    return reply({count: (res[0] && res[0].notifications_count) || 0});
  })
  .catch((e) => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  });
};

controller.markNotificationsRead = function (request, reply) {
  if (request.role != 'CUSTOMER') {
    return reply(Boom.unauthorized());
  }
  const customerId = request.customerId;

  Customers
    .findOne({_id: customerId})
    .then((customer) => {
      if (!customer) {
        return reply(Boom.notFound(request.i18n.__('404_CUSTOMER')));
      }
      customer.notifications = customer.notifications.map((notif) => {
        if (!notif.title.en) {
          let tmp = notif.title;
          notif.title = {
            en: tmp,
            th: tmp
          };
          tmp = notif.detail;
          notif.detail = {
            en: tmp,
            th: tmp
          };
        }
        notif.un_read = false;
        return notif;
      });
      customer.markModified('notifications');
      customer.save().then(() => {
        return reply({success: true});
      })
      .catch((e) => {
        console.log(e);
        return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
      });
    })
    .catch((e) => {
      console.log(e);
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
};

controller.getNotifications = function (request, reply) {
  if (request.role != 'CUSTOMER') {
    return reply(Boom.unauthorized());
  }
  const limit = request.query.limit || 30;
  const skip = (request.query.page || 0) * limit;
  const customerId = request.customerId;
  Customers.aggregate([
    {
      $match: {
        _id: ObjectId(customerId)
      }
    },
    {
      $unwind: '$notifications'
    },
    {
      $sort: {
        'notifications.timestamp': -1
      }
    },
    {
      $group: {
        _id: null,
        notification: { $push: "$notifications" }
      }
    },
    {
      $project: {
        notification: 1,
        total: { $size: "$notification" }
      }
    },
    {
      $project: {
        total: 1,
        notifications: {
          $slice: ['$notification', skip, limit] // skip, limit
        }
      }
    }
  ])
  .then((aggregated) => {
    if (aggregated[0]) {
      return reply({data: aggregated[0].notifications, paging: { total: aggregated[0].total}});
    } else {
      return reply({data: [], paging: { total: 0}});
    }
  })
  .catch((er) => {
    console.log(er);
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  });
};

controller.deleteNotification = function (request, reply) {
  if (request.role !== 'CUSTOMER') {
    return reply(Boom.unauthorized());
  }
  Customers.findOne({_id: request.customerId}).then((customer) => {
    const notificationId = request.params.notification_id;
    if (!customer) {
      return reply(Boom.notFound(request.i18n.__('404_CUSTOMER')));
    }
    Customers.update({ _id: request.customerId },
      { $pull: { 'notifications': { _id: notificationId } } }
      , (err, customer) => {
        if (err) {
          return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
        }
        return reply({success: true, message: request.i18n.__('200_NOTIFICATION_DELETED')});
      })
  }).catch((err) => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  })
};

// PUT /customers/{id}
controller.update = function (request, reply) {
  var findObj = {_id: request.customerId};
  const doc = request.payload;
  Customers
    .update(findObj, doc, (err, customer) => {
      if (err) {
        return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
      }
      reply(customer);
    });
}

controller.getDealsBySlotAndRadius = function (request, reply) {
  const category = request.query.category;
  const slotStart = request.query.start;
  const radiusInMeters = request.query.radius;
  const cords = [request.query.lng, request.query.lat];
  const aggregation = [];
  // find shops that are near by that have at least 1 deal
  aggregation.push({
    $geoNear: {
      near: {
        type: 'Point',
        coordinates: cords
      },
      maxDistance: radiusInMeters * 1000, //converts to meters
      distanceField: "distance",
      distanceMultiplier: 6378.137,//kms
      query: { deals: { $exists: true, $ne: [] } },
      spherical: true
    }
  });

  // populate deal
  aggregation.push({
    $lookup: {
      from: 'deals', localField: 'deals', foreignField: '_id', as: 'deals'
    }
  });
  // unwind the deals
  aggregation.push({
    $unwind: '$deals'
  });

  // If category, then filter by it early so we don't waste time
  if (category) {
    aggregation.push({
      $match: {
        'deals.category': ObjectId(category)
      }
    });
  }

  // unwind the slots
  aggregation.push({
    $unwind: '$deals.availability.slots'
  });
  // match by start and stop of the slots with given time slot
  aggregation.push({
    $match: {
      "deals.availability.slots.start": {
        $gte: slotStart
      },
      // "deals.availability.slots.stop": {
      //   $gte: slotEnd
      // }
    }
  });
  // now multiply the days with factor so we have equvialent in days
  aggregation.push({
    $project: {
      pictures: 1,
      phone: 1,
      name: 1,
      rating: 1,
      address: 1,
      location: 1,
      deals: {
        _id: 1,
        availability: 1,
        description: 1,
        terms: 1,
        reviews: 1,
        name: 1,
        pictures: 1,
        original_price: 1,
        days: {
          $multiply: [ "$deals.availability.days", 24*60*60000]
        }
      }
    }
  });
  // now add the number of days to the starting_date in each deal that becomes ending date of deal
  aggregation.push({
    $project: {
      pictures: 1,
      name: 1,
      phone: 1,
      rating: 1,
      address: 1,
      location: 1,
      deals: {
        _id: 1,
        availability: 1,
        description: 1,
        terms: 1,
        reviews: 1,
        name: 1,
        pictures: 1,
        original_price: 1,
        days: 1,
        ending_date: {
          $add: [ "$deals.availability.starting_date", "$deals.days"]
        }
      }
    }
  });
  //
  // // compare the ending date with date now if its not less than deal is still active
  aggregation.push({
    $match: {
      "deals.ending_date": {
        $gt: new Date()
      }
    }
  });

  // group by slots for deals
  aggregation.push({
    $group: {
      _id: '$deals._id',
      shop_id: {$first: '$_id'},
      shop_pictures: {$first: '$pictures'},
      shop_name: {$first: '$name'},
      shop_rating: {$first: '$rating'},
      shop_phone: {$first: '$phone'},
      shop_address: {$first: '$address'},
      shop_location: {$first: '$location'},

      deal_id: {$first: '$deals._id'},
      deal_availability: {$first: '$deals.availability'},
      deal_description: {$first: '$deals.description'},
      deal_terms: {$first: '$deals.terms'},
      deal_reviews: {$first: '$deals.reviews'},
      deal_name: {$first: '$deals.name'},
      deal_pictures: {$first: '$deals.pictures'},
      deal_original_price: {$first: '$deals.original_price'},
      deal_slots: { $addToSet: '$deals.availability.slots'}
    }
  });

  // group by shop
  aggregation.push({
    $group: {
      _id: '$shop_id',
      pictures: {$first: '$shop_pictures'},
      name: {$first: '$shop_name'},
      rating: {$first: '$shop_rating'},
      address: {$first: '$shop_address'},
      phone: {$first: '$shop_phone'},
      location: {$first: '$shop_location'},
      deals: {
        $addToSet: {
          id: '$deal_id',
          availability: '$deal_availability',
          description: '$deal_description',
          terms: '$deal_terms',
          reviews: '$deal_reviews',
          name: '$deal_name',
          pictures: '$deal_pictures',
          original_price: '$deal_original_price',
          slots: '$deal_slots'
        }
      }
    }
  });

  Shops
    .aggregate(aggregation)
    .exec()
    .then((shops) => {
      return reply(shops);
    })
    .catch((err) => {
      console.log(err);
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
};
// GET: customers/deals/{deal_id}/reviews get deal reviews for customer by deal id
controller.getDealReviews = function (request, reply) {
  Deals.findOne({_id: request.params.deal_id}).populate('reviews.reviewed_by', ['name', 'profile_picture']).then((deal) => {
    return reply(deal.reviews);
  }).catch((err) => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  })
}

controller.getDeals = function (request, reply) {
  const sortMapper = {
    price: {
      original_price: 1 // Ascending, lower price goes first
    },
    date: {
      max_discount: -1,
      created_at: -1  // Descending, deals with newest date comes first
    },
    rating: {
      rating: -1 // Descending, higher rating goes first
    }
  };
  const limit = request.query.limit || 30;
  const skip = (request.query.page || 0) * limit;
  const sortBy = request.query.sort_by || 'date';
  const minPrice = request.query.min_price || 0;
  const maxPrice = request.query.max_price;
  const minDiscount = request.query.min_discount || 0;
  const maxDiscount = request.query.max_discount || 100;
  const aggregation = [];
  // match deals by id
  let matchObj = {};
  if (request.query.category) {
    matchObj.category = ObjectId(request.query.category);
  }
  if (request.query.shop) {
    matchObj.shop = ObjectId(request.query.shop);
  }
  if(request.query.special_deal) {
    matchObj.special_deal = true;
  }
  aggregation.push({
    $match: matchObj
  });

  // now multiply the days with factor so we have equvialent in days
  aggregation.push({
    $project: {
      availability: 1,
      description: 1,
      special_deal: 1,
      terms: 1,
      reviews: 1,
      rating: 1,
      name: 1,
      created_at: 1,
      pictures: 1,
      max_discount: 1,
      min_discount: 1,
      original_price: 1,
      shop: 1,
      days: {
        $multiply: [ "$availability.days", 24*60*60000]
      }
    }
  });

  // now add the number of days to the starting_date in each deal that becomes ending date of deal
  aggregation.push({
    $project: {
      shop: 1,
      availability: 1,
      description: 1,
      special_deal: 1,
      terms: 1,
      rating: 1,
      reviews: 1,
      name: 1,
      pictures: 1,
      max_discount: 1,
      created_at: 1,
      min_discount: 1,
      original_price: 1,
      days: 1,
      ending_date: {
        $add: [ "$availability.starting_date", "$days"]
      }
    }
  });

  // compare the ending date with date now if its not less than deal is still active
  const priceFilter = {
    $gte: minPrice,
  };
  if (maxPrice) {
    priceFilter.$lte = maxPrice;
  }
  aggregation.push({
    $match: {
      ending_date: {
        $gt: new Date()
      },
      "availability.starting_date": {
        $lte: new Date()
      },
      original_price: priceFilter,
      min_discount: {
        $gte: minDiscount
      },
      max_discount: {
        $lte: maxDiscount
      }
    }
  });

  // sort by given value
  aggregation.push({
    $sort: sortMapper[sortBy]
  });

 

  // populate shop
  aggregation.push({
    $lookup: {
      from: 'shops', localField: 'shop', foreignField: '_id', as: 'shop'
    }
  });

  Deals
    .aggregate(aggregation)
    .skip(skip)
    .limit(limit)
    .exec()
    .then((deals) => {
      aggregation.push({
        $group: { _id: null, count: { $sum: 1 } }
      });
      Deals.aggregate(aggregation).exec().then((total) => {
        return reply({data: deals, paging: { total: total[0] && total[0].count }});
      })
      .catch(() => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    })
};
// GET: api/customers/orders/{order_id} get orders for customer by id
controller.getOrderById = function (request, reply) {
  if (request.role === 'CUSTOMER') {
    Orders
    .findOne({_id: request.params.order_id, customer: request.customerId})
    .populate('shop', ['location','phone', 'name', 'address', 'rating'])
    .populate('deal', ['name'])
    .then((order) => {
      if (!order) {
        return reply(Boom.notFound(request.i18n.__('404_ORDER')));
      }
      return reply(order);
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    })
  } else {
    return reply(Boom.unauthorized());
  }
};
// GET: api/customers/shops get shops for customer
controller.getShops = function (request, reply) {
  
  const aggregation = [];

  // populate deals
  aggregation.push({
    $lookup: {
      from: 'deals', localField: '_id', foreignField: 'shop', as: 'deals'
    }
  });

  aggregation.push({
    $unwind: '$deals'
  });

  aggregation.push({
    $project: {
      name: 1,
      logo: 1,
      rating: 1,
      'deals._id': 1,
      'deals.availability.days': 1,
      'deals.availability.starting_date': 1,
    }
  });

  aggregation.push({
    $project: {
      _id: 1,
      name: 1,
      logo: 1,
      rating: 1,
      'deals._id': 1,
      'deals.availability.starting_date': 1,
      'deals.days': {
        $multiply: [ '$deals.availability.days', 24*60*60000]
      }
    }
  });

  aggregation.push({
    $project: {
      _id: 1,
      name: 1,
      logo: 1,
      rating: 1,
      'deals._id': 1,
      'deals.ending_date': {
        $add: [ '$deals.availability.starting_date', '$deals.days']
      }
    }
  });

  const currentDate = new Date();

  aggregation.push({
    $group: {
      _id: '$_id',
      name: {$first: '$name'},
      logo: {$first: '$logo'},
      rating: {$first: '$rating'},
      deals: {
        $push: '$deals'
      }
    }
  });

  aggregation.push({
    $project: {
      _id: 1,
      name: 1,
      logo: 1,
      rating: 1,
      deals: {
        $filter: {
          input: '$deals',
          as: 'deal',
          cond: { $gte: ['$$deal.ending_date', currentDate]}
        }
      }
    }
  });

  aggregation.push({
    $sort: {
      rating: -1
    }
  });

  Shops
    .aggregate(aggregation)
    .then((shops) => {
      return reply(shops);
    }).catch((err) => {
      console.log(err);
      return reply(Boom.internal('Mongo read error!'));
    });
};

// GET: api/customers/orders get orders for customer
controller.getOrders = function (request, reply) {
  const limit = request.query.limit || 30;
  const skip = (request.query.page || 0) * limit;
  if (request.role === 'CUSTOMER') {
    Orders
    .find({customer: request.customerId})
    .populate('shop', 'name pictures')
    .populate('deal', 'name pictures ')
    .limit(limit)
    .skip(skip)
    .then((orders) => {
      Orders.count({customer: request.customerId}).exec().then((total) => {
        return reply({data: orders, paging: { total }});
      })
      .catch(() => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
    })
    .catch((error) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};

controller.rateOrder = function (request, reply) {
  const orderId = request.params.order_id;
  const customerId = request.customerId;
  Orders
  .findOne({_id: orderId, customer: customerId})
  .then((Order) => {
    if (!Order) {
      return reply(Boom.notFound(request.i18n.__('404_ORDER')));
    }

    if (Order.status == 'RATED') {
      return reply({error: true, message: request.i18n.__('200_ORDER_RATED')});
    }
    Deals.findOne({
      _id: ObjectId(Order.deal)
    })
    .then((Deal) => {
      if (!Deal) {
        return reply(Boom.notFound('Deal not found'));
      }
      Deal.reviews = Deal.reviews || [];
      Deal.reviews.push({
        reviewed_by: customerId,
        rating: request.payload.rating,
        review: request.payload.review
      });
      // update the deal rating
      Deal.rating = Deal.reviews.reduce((sum, val) => sum + val.rating, 0);
      Deals.update({_id: Deal._id }, Deal, (err, deal) => {
        if(err) {
          return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
        }
        // update the shop rating
        Shops.findOne({_id: Deal.shop}).then((Shop) => {
          if (!Shop) {
            return reply(Boom.notFound());
          }
          Deals.aggregate([
            {
              $match: {
                shop: ObjectId(Shop._id)
              }
            },
            {
              $group: {
                _id: null,
                rating: {
                  $avg: "$rating"
                }
              }
            }
          ])
          .then((dealsOutput) => {
            Shop.rating = (dealsOutput[0] && dealsOutput[0].rating) || Shop.rating;
            Shops.update({_id: Shop._id}, Shop, (err, shop) => {
              if(err) {
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              }
              Order.status = 'RATED';
              Order.rating = request.payload.rating;
              Orders.update({_id: Order._id}, Order, (err, order) => {
                if(err) {
                  return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
                }
                return reply({success: true});
              });
            });
          })
          .catch((err) => {
            return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
          });
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
      });
      
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  })
  .catch(() => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  });
};

// GET: api/customers/add_card/{card_token} adds a card for a customer
controller.addCard = function(request, reply) {
  const card_token = request.params.card_token;
  const customerId = request.customerId;
  if (request.role === 'CUSTOMER') {
    Customers
    .findOne({_id: customerId})
    .then((customer) => {
      if (!customer) {
        return reply(Boom.notFound(request.i18n.__('404_CUSTOMER')));
      }
      if (customer.omise_customer_id) {
        OmiseService
        .addCard(customer.omise_customer_id, card_token)
        .then((succ) => {
          return reply({success: true});
        }).catch((err) => {
          if (err.code) {
            const errMessageCode = OmiseService.errorMessage(err.code);
            return reply(Boom.internal(request.i18n.__(errMessageCode)));
          }
          return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
        });
      } else {
        OmiseService
        .createCustomerAndAttachCard(customer.name)
        .then((data) => {
          const doc = {
            omise_customer_id: data.omise_customer_id
          };
          Customers.update({_id: customerId}, doc, (err, customer) => {
            if (err) {
              return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
            }
            return reply({success: true});
          });
        }).catch((err) => {
          if (err.code) {
            const errMessageCode = OmiseService.errorMessage(err.code);
            return reply(Boom.internal(request.i18n.__(errMessageCode)));
          }
          return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
        });
      }
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};

  // GET: api/customers/list_cards lists all cards of a customer
controller.listCards = function(request, reply) {
  const customerId = request.customerId;
  if (request.role === 'CUSTOMER') {
    Customers.findOne({_id: customerId}).then((customer) => {
      if (!customer.omise_customer_id) {
        return;
      }
      OmiseService
      .listCards(customer.omise_customer_id)
      .then((cardsList) => {
        return reply({success: true, data: cardsList});
      }).catch((err) => {
        if (err.code) {
          const errMessageCode = OmiseService.errorMessage(err.code);
          return reply(Boom.internal(request.i18n.__(errMessageCode)));
        }
        return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
      });
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};

//GET: api/customers/retrieve_card/{card_id} retrieve a card for a customer 
controller.retrieveCard = function(request, reply) {
  const customerId = request.customerId;
  const card_id = request.params.card_id;
  if (request.role === 'CUSTOMER') {
    Customers.findOne({_id: customerId}).then((customer) => {
      if (!customer.omise_customer_id) {
        return;
      }
      OmiseService
      .retrieveCard(customer.omise_customer_id, card_id)
      .then((card) => {
        return reply({success: true, data: card});
      }).catch((err) => {
        if (err.code) {
          const errMessageCode = OmiseService.errorMessage(err.code);
          return reply(Boom.internal(request.i18n.__(errMessageCode)));
        }
        return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
      });
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};

controller.destroyCard = function(request, reply) {
  const customerId = request.customerId;
  const card_id = request.params.card_id;
  if (request.role === 'CUSTOMER') {
    Customers.findOne({_id: customerId}).then((customer) => {
      if (!customer.omise_customer_id) {
        return;
      }
      OmiseService
      .destroyCard(customer.omise_customer_id, card_id)
      .then((card) => {
        console.log(card);
        return reply({success: true});
      }).catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
      });
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};

controller.createSource = function(request, reply) {
  const type = request.payload.type;
  const amount = request.payload.amount;
  const order_id = request.payload.order_id;
  if (request.role === 'CUSTOMER') {
    OmiseService
    .createSource(type, amount, order_id)
    .then((res) => {
      return reply(res);
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};

controller.retrieveCharge = function(request, reply) {
  const charge_id = request.params.charge_id;
  if (request.role === 'CUSTOMER') {
    OmiseService
    .retrieveCharge(charge_id)
    .then((charge) => {
      return reply(charge);
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};

module.exports = controller;
