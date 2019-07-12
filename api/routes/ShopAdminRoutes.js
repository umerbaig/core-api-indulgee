'use strict';
const Joi = require('joi');
const ShopAdminsController = require('../controllers/ShopAdminsController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/shop_admins',
      config: {
        auth: 'jwt',
        handler: ShopAdminsController.getAll,
        validate: {
          query: {
            page: Joi.number(),
            limit: Joi.number(),
            shop: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
          }
        },
        tags: ['api', 'shop_admin'],
        description: 'Filter shop admins by provider {default}, if shop id given then filter by shop & provider',
        notes: 'Filter shop admins by provider {default}, if shop id given then filter by shop & provider'
      }
    },
    {
      method: 'POST',
      path: '/shop_admins/{admin_id}/reset_pass',
      config: {
        auth: 'jwt',
        handler: ShopAdminsController.resetPass,
        validate: {
          params: {
            admin_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          },
          payload: {
            password: Joi.string().required(),
            shop: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          }
        },
        tags: ['api', 'shop_admin'],
        description: 'Reset password of shop admin, by provider',
        notes: 'Reset password of shop admin, by provider'
      }
    }
  ]);
};
