'use strict';
const ShopAdmins = require('../models/Users');
const Shops = require('../models/Shops');
const Boom = require('boom');
const bcrypt = require('bcrypt');
const ObjectId = require('mongoose').Types.ObjectId;
const controller = {};

// GET /shop_admins filter shop admin by provider {default}, if shop id given then filter by shop & provider

controller.getAll = function (request, reply) {
  const limit = request.query.limit || 30;
  const skip = (request.query.page || 0) * limit;
  if (request.role === 'PROVIDER') {
    let mongoFilter = {provider: request.providerId, type: 'SHOP_ADMIN'};
    if (request.query.shop) {
      mongoFilter.shop = request.query.shop;
    }
    ShopAdmins
      .find(mongoFilter)
      .limit(limit)
      .skip(skip)
      .populate('shop', 'name')
      .then((shopAdmins) => {
        ShopAdmins.count(mongoFilter).exec().then((total) => {
          return reply({data: shopAdmins, paging: { total }});
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
};

controller.resetPass = function (request, reply) {
  if (!request.providerId) return reply(Boom.forbidden());
  const adminId = request.params.admin_id;
  const password = request.payload.password;
  const shop = request.payload.shop;
  Shops.findOne({
    _id: shop,
    provider: request.providerId,
    shop_admins: adminId
  })
  .then((shop) => {
    if (!shop) {
      return reply(Boom.notFound(request.i18n.__('404_SHOP')));
    }

    ShopAdmins
      .findOne({_id: adminId})
      .then((User) =>{
        if (!User) {
          return reply({error: true, message: request.i18n.__('200_NO_SHOP_ADMIN')});
        }
        hashPassword(password).then((hashPassword) => {
          const doc = {
            password: hashPassword
          };
          ShopAdmins
            .update({_id: User._id}, doc, (err, res) => {
              if (err) {
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              }
              reply({success: true, message: request.i18n.__('200_PASSWORD_SAVED')});
            });
        }).catch((err) => {
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

function hashPassword(password) {
  const promise = new Promise((resolve, reject) => {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) return reject(err);
      // hash the password along with our new salt
      bcrypt.hash(password, salt, function (err, hash) {
        if (err) return reject(err);
        // if all is ok then return hash password
        resolve(hash);
      });
    });
  });
  return promise;
}

module.exports = controller;
