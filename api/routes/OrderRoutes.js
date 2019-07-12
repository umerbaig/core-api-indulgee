'use strict';
const Joi = require('joi');
const OrdersController = require('../controllers/OrdersController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/orders',
      config: {
        auth: 'jwt',
        handler: OrdersController.getOrders,
        validate: {
          query: {
            shop: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
            page: Joi.number(),
            limit: Joi.number()
          }
        },
        tags: ['api', 'orders'],
        description: 'Filter orders by provider {default}, if shop id given then filter orders by shop',
        notes: 'Filter orders by provider {default}, if shop id given then filter orders by shop'
      },
    },
    {
      method: 'GET',
      path: '/orders/{id}',
      config: {
        auth: 'jwt',
        handler: OrdersController.getOrderById,
        validate: {
          params: {
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          },
          query: {
            shop: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
          }
        },
        tags: ['api', 'orders'],
        description: 'Filter order by id & provider {default}, if shop id given then filter order by id & shop',
        notes: 'Filter order by id & provider {default}, if shop id given then filter order by id & shop'
      },
    },
    {
      method: 'POST',
      path: '/orders',
      config: {
        auth: 'jwt',
        handler: OrdersController.create,
        validate: {
          payload: Joi.object({
            payment_method: Joi.string().valid(['CASH', 'CARD', 'INTERNET_BANKING']).required(),
            shop: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            deal: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            slot: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            note: Joi.string().optional(),
            people_allow: Joi.number().optional(),
            booking_date: Joi.string().required()
            // card_token: Joi.string().optional(),
            // card_id: Joi.string().optional()
          }).required()
        },
        tags: ['api', 'orders'],
        description: 'Create Order',
        notes: 'Create Order'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{id}/cancel',
      config: {
        auth: 'jwt',
        handler: OrdersController.update,
        validate: {
          params: {
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          }
        },
        tags: ['api', 'orders'],
        description: 'Cancel order data by id',
        notes: 'Cancel order data by id'
      }
    },
    {
      method: 'PUT',
      path: '/orders/{id}',
      config: {
        auth: 'jwt',
        handler: OrdersController.update,
        validate: {
          params: {
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          },
          payload: Joi.object({
            status: Joi.string().valid(['PENDING','ORDERED','COMPLETED','CANCELED', 'CONFIRMED']).required(),
          })
        },
        tags: ['api', 'orders'],
        description: 'Update order status by id',
        notes: 'Update order status by id'
      }
    }
  ]);
};
