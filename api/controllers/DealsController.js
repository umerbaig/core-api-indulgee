'use strict';
const Shops = require('../models/Shops');
const Deals = require('../models/Deals');
const ObjectId = require('mongodb').ObjectId;
const _ = require('underscore');
const Boom = require('boom');
const controller = {};

// GET: api/shops/{shop_id}/deals get deals data based upon specific role i.e admin, provider
controller.getAll = function (request, reply) {
  let findShopFilter = {};
  let findDealsFilter = {};
  const limit = request.query.limit || 30;
  const skip = (request.query.page || 0) * limit;
  if (request.role === 'SHOP_ADMIN' && request.shop) {
    findShopFilter._id = request.shop;
    findDealsFilter.shop = request.shop;
  } else if (request.role === 'PROVIDER') {
    if (request.query.shop_id) {
      findShopFilter._id = request.query.shop_id;
      findShopFilter.provider = request.providerId;
      findDealsFilter.shop = request.query.shop_id;
    } else {
      const aggregation = [];
      // populate shop
      aggregation.push({
        $lookup: {
          from: 'shops', localField: 'shop', foreignField: '_id', as: 'shop'
        }
      });
      // filter deals with provider id
      aggregation.push({
        $match: {
          'shop.provider': ObjectId(request.providerId)
        }
      });
      Deals
        .aggregate(aggregation)
        .skip(skip)
        .limit(limit)
        .exec()
        .then((deals) => {
          Deals
            .aggregate(aggregation)
            .exec()
            .then((totalDeals) => {
              const total = totalDeals.length;
              return reply({data: deals, paging: { total}});
            })
            .catch(() => {
              return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
            });
        }).catch(() => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
      return;
    }
  } else {
    return reply(Boom.unauthorized());
  }
  Shops
    .findOne(findShopFilter)
    .exec()
    .then((shop) => {
      if (!shop) {
        return reply(Boom.notFound(request.i18n.__('404_SHOP')));
      }
      Deals
        .find(findDealsFilter)
        .populate('shop')
        .skip(skip)
        .limit(limit)
        .exec()
        .then((deals) => {
          Deals.count(findDealsFilter).exec().then((total) => {
            return reply({data: deals, paging: { total }});
          })
          .catch(() => {
            return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
          });
        })
        .catch((err) => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
};

// GET: api/shops/{shop_id}/deals/{deal_id} get deal by id
controller.getOne = function (request, reply) {
  let findShopFilter = {};
  let findDealFilter = {_id: request.params.deal_id};
  if (request.role === 'SHOP_ADMIN' && request.shop) {
    findShopFilter._id = request.shop;
    findDealFilter.shop = request.shop;
  } else if (request.role === 'PROVIDER' && request.params.shop_id) {
    findShopFilter._id  = request.params.shop_id;
    findShopFilter.provider = request.providerId;
    findDealFilter.shop = request.params.shop_id;
  } else {
    return reply(Boom.unauthorized());
  }
  Shops
    .findOne(findShopFilter)
    .exec()
    .then((shop) => {
      if (!shop) {
        return reply(Boom.notFound(request.i18n.__('404_SHOP')));
      }
      Deals
        .findOne(findDealFilter)
        .exec()
        .then((deal) => {
          return reply(deal);
        })
        .catch((err) => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
}

// POST: api/shops/{shop_id}/deals
controller.create = function (request, reply) {
  let Deal = new Deals(request.payload);
  let findShopFilter = {};
  if (request.role === 'SHOP_ADMIN' && request.shop) {
    Deal.shop = request.shop;
    findShopFilter._id = request.shop;
  } else if (request.role === 'PROVIDER' && request.params.shop_id) {
    Deal.shop = request.params.shop_id;
    findShopFilter._id = request.params.shop_id;
  } else {
    return reply(Boom.unauthorized());
  }

  Deal.created_by = request.user;
  Deal.availability.slots = Deal.availability.slots.map((slot) => {
    slot.discount = Math.ceil((100 - (slot.price / Deal.original_price) * 100)); // Get the discount in each slot
    slot.seats_available = slot.seats;
    return slot;
  });
  Deal.max_discount = Deal.availability.slots.sort((s1, s2) => s2.discount - s1.discount)[0].discount; // sort descending
  Deal.min_discount = Deal.availability.slots.sort((s1, s2) => s1.discount - s2.discount)[0].discount; // sort ascending
  Shops.findOne(findShopFilter).then((shop) => {
    if (!shop) {
      return reply(Boom.notFound(request.i18n.__('404_SHOP')));
    }
    Deal
      .save()
      .then((deal) => {
        const doc = {
          deals: shop.deals,
          updated_at: new Date()
        };
        doc.deals.splice(0, 0, deal._id);
        Shops.update({_id: deal.shop}, doc, (err, shop) => {
          if (err) {
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          }
          return reply({success: true, deal_id: deal._id});
        });
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
      });
  }).catch((err) => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  });
};


// PUT: api/shops/{shop_id}/deals/{deal_id}
controller.update = function (request, reply) {
  let findDealFilter = {_id: request.params.deal_id};
  if (request.role === 'SHOP_ADMIN' && request.shop) {
    findDealFilter.shop = request.shop;
  } else if (request.role === 'PROVIDER' && request.params.shop_id) {
    findDealFilter.shop = request.params.shop_id;
  } else {
    return reply(Boom.unauthorized());
  }
  let error = false;

  Deals
    .findOne(findDealFilter)
    .then((deal) => {
      if (!deal) {
        return reply(Boom.notFound(request.i18n.__('404_DEAL')));
      }
      let doc = request.payload;
      if (doc.availability && doc.availability.slots) {
        doc.availability.slots = doc.availability.slots.map((slot) => {
          const origSlot = deal.availability.slots.filter(s => s._id == slot._id)[0] || { _id: ObjectId() };
          slot.discount = Math.ceil(100 - ((slot.price / deal.original_price) * 100)); // Get the discount in each slot
          if (origSlot.seats && (slot.seats_available > origSlot.seats || slot.seats_available < 0)) {
            error = true;
          }
          slot = _.extend(origSlot, slot);
          return slot;
        });
        doc.max_discount = doc.availability.slots.sort((s1, s2) => s2.discount - s1.discount)[0].discount; // sort descending
        doc.min_discount = doc.availability.slots.sort((s1, s2) => s1.discount - s2.discount)[0].discount; // sort ascending
      }
      doc.updated_at = new Date();

      if (error) {
        return reply(Boom.badRequest(request.i18n.__('400_SEATS_VAL_INCORRECT')));
      }

      Deals
        .update({_id: request.params.deal_id}, {$set: doc} , (err, deal) => {
          if (err) {
            console.log(err);
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          }
          return reply({success: true, message: request.i18n.__('200_DEAL_UPDATED')});
        });
    })
    .catch((err) => {
      console.log(err);
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
};


// DELETE: api/shops/{shop_id}/deals/{deal_id}
controller.delete = function (request, reply) {
  let findDealFilter = {_id: request.params.deal_id};
  let findShopFilter = {};
  if (request.role === 'SHOP_ADMIN' && request.shop) {
    findDealFilter.shop = request.shop;
    findShopFilter._id = request.shop;
  } else if (request.role === 'PROVIDER' && request.params.shop_id) {
    findDealFilter.shop = request.params.shop_id;
    findShopFilter._id = request.params.shop_id;
  } else {
    return reply(Boom.unauthorized());
  }
  Shops.findOne(findShopFilter).then((shop) => {
    if (!shop) {
      return reply(Boom.notFound(request.i18n.__('404_SHOP')));
    }
    Deals
      .findOne(findDealFilter)
      .then((deal) => {
        if (!deal) {
          return reply(Boom.notFound(request.i18n.__('404_SHOP')));
        }
        Deals
          .remove({_id: request.params.deal_id})
          .exec()
          .then(() => {
            const doc = {
              deals: shop.deals,
              updated_at: new Date()
            };
            doc.deals.splice(doc.deals.indexOf(deal._id),1)
            Shops.update(findShopFilter,doc, (err, sh) => {
              if (err) {
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              }
              return reply({success: true, message: request.i18n.__('200_DEAL_DELETED')});
            });
          })
          .catch((err) => {
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          });
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  }).catch((err) => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  });
}

module.exports = controller;
