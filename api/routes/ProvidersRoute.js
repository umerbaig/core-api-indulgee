'use strict';
const Joi = require('joi');
const ProvidersController = require('../controllers/ProvidersController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/providers',
      config: {
        auth: 'jwt',
        handler: ProvidersController.getAll,
        validate: {
          query: {
            page: Joi.number(),
            limit: Joi.number()
          }
        },
        tags: ['api', 'providers'],
        description: 'Get all providers',
        notes: 'Get all providers'
      }
    },
    {
      method: 'PUT',
      path: '/providers',
      config: {
        auth: false,
        handler: ProvidersController.update,
        validate: {
          payload: Joi.object({
            name: Joi.string().optional(),
            phone: Joi.string().optional(),
            email: Joi.string().email().optional(),
          })
        },
        tags: ['api', 'providers'],
        description: 'Update provider data',
        notes: 'Update provider data'
      }
    }
  ]);
};
