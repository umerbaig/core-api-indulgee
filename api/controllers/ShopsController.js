'use strict';
const Shops = require('../models/Shops');
const Providers = require('../models/Providers');
const Boom = require('boom');
const controller = {};

// GET: api/shops get shops data based upon specific role
controller.getAll = function (request, reply) {
  const limit = request.query.limit || 40;
  const skip = (request.query.page || 0) * limit;
  if (request.role === 'ADMIN') {
    Shops
      .find()
      .skip(skip)
      .limit(limit)
      .exec()
      .then((shops) => {
        Shops.count().exec().then((total) => {
          return reply({data: shops, paging: { total }});
        })
        .catch(() => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  } else if (request.role === 'PROVIDER') {
    Shops
      .find({provider: request.providerId})
      .skip(skip)
      .limit(limit)
      .exec()
      .then((shops) => {
        Shops.count({provider: request.providerId}).exec().then((total) => {
          return reply({data: shops, paging: { total }});
        })
        .catch(() => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
      }).catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  } else {
    return reply(Boom.unauthorized());
  }
}
// GET: api/shops/{id} get shop data by id based upon specific role
controller.getById = function (request, reply) {
  if (request.role === 'ADMIN') {
    Shops
      .findById({_id: request.params.id})
      .exec()
      .then((shop) => {
        return reply(shop);
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  } else if (request.role === 'PROVIDER') {
    Shops
      .findOne({provider: request.providerId, _id: request.params.id})
      .exec()
      .then((shop) => {
        reply(shop);
      }).catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  } else {
    return reply(Boom.unauthorized());
  }
}
// POST: api/shops
controller.create = function (request, reply) {
  if (request.role === 'PROVIDER') {
    const Shop = new Shops(request.payload);
    Shop.provider = request.providerId;
    Shop.created_by = request.user;
    const findByProviderFilter = {_id: request.providerId};
    Providers.findOne(findByProviderFilter).then((provider) => {
      if (!provider) {
        return reply(Boom.notFound());
      }
      Shop
        .save()
        .then((shop) => {
          const doc = {
            shops: provider.shops
          };
          doc.shops.splice(0,0,shop._id)
          Providers.update(findByProviderFilter, doc, (err, pr) => {
            if (err) {
              return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
            }
            return reply({success: true, shop_id: shop._id});
          });
        })
        .catch((err) => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
        });
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
}
// PUT: api/shops/{id}
controller.update = function (request, reply) {
  Shops
    .findOne({_id: request.params.id, provider: request.providerId})
    .then((shop) => {
      if (!shop) {
        return reply(Boom.notFound(request.i18n.__('404_SHOP')));
      }
      const doc = request.payload;
      doc.updated_at = new Date();
      Shops
        .update({_id: request.params.id}, doc, (err, shop) => {
          if (err) {
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          }
          return reply({success: true, message: request.i18n.__('200_SHOP_UPDATED')});
        });
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
}
// DELETE: api/shops/{id}
controller.delete = function (request, reply) {
  if (request.role === 'ADMIN') {
    Shops
      .findById(request.params.id)
      .exec()
      .then((shop) => {
        if (!shop) {
          return reply(Boom.notFound(request.i18n.__('404_SHOP')));
        }
        Shops
          .remove({_id: request.params.id})
          .exec()
          .then(() => {
            return reply({success: true, message: request.i18n.__('200_SHOP_DELETED')});
          })
          .catch((err) => {
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          });
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  } else if (request.role === 'PROVIDER') {
    const findByProviderFilter = {_id: request.providerId};
    Providers.findOne(findByProviderFilter).then((provider) => {
      if(!provider) {
        return reply(Boom.notFound());
      }
      Shops
        .findOne({_id: request.params.id, provider: request.providerId})
        .then((shop) => {
          if (!shop) {
            return reply(Boom.notFound(request.i18n.__('404_SHOP')));
          }
          Shops
            .remove({_id: request.params.id})
            .exec()
            .then(() => {
              const doc = {
                shops: provider.shops
              };
              doc.shops.splice(doc.shops.indexOf(shop._id), 1)
              Providers.update(findByProviderFilter, doc, (err, pr) => {
                if (err) {
                  return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
                }
                return reply({success: true, message: request.i18n.__('200_SHOP_DELETED')});
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
  } else {
    return reply(Boom.unauthorized());
  }
}

module.exports = controller;
