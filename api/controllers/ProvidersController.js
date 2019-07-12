'use strict';
const Providers = require('../models/Providers');
const Boom = require('boom');
const controller = {};

// GET /providers

controller.getAll = function (request, reply) {
  const limit = request.query.limit || 30;
  const skip = (request.query.page || 0) * limit;
  Providers
    .find()
    .limit(limit)
    .skip(skip)
    .exec()
    .then((providers) => {
      Providers.count().exec().then((total) => {
        return reply({data: providers, paging: { total }});
      })
      .catch(() => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
}

// PUT /provider/{id}

controller.update = function (request, reply) {
  var findObj = {_id: request.providerId};
  const doc = request.payload;
  Providers
    .update(findObj, doc, (err, provider) => {
      if (err) {
        return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
      }
      return reply(provider);
    });
};

module.exports = controller;
