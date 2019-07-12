'use strict';
const Joi = require('joi');
const ShopsController = require('../controllers/ShopsController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/shops',
      config: {
        auth: 'jwt',
        handler: ShopsController.getAll,
        validate: {
          query: {
            page: Joi.number(),
            limit: Joi.number()
          }
        },
        tags: ['shops'],
        description: 'Get all shops based upon specific role',
        notes: 'Get all shops, API will automatically detect admin or provider & return shops according to specific role.'
      }
    },
    {
      method: 'GET',
      path: '/shops/{id}',
      config: {
        auth: 'jwt',
        handler: ShopsController.getById,
        validate: {
          params: {
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          }
        },
        tags: ['api', 'shops'],
        description: 'Get shop data by id',
        notes: 'Get shop data by id'
      }
    },
    {
      method: 'POST',
      path: '/shops',
      config: {
        auth: 'jwt',
        handler: ShopsController.create,
        validate: {
          payload: Joi.object({
            name: {
              en: Joi.string().min(3).required(),
              th: Joi.string().min(3).required()
            },
            location: Joi.object({
              type: Joi.string().default('Point'),
              coordinates: Joi.array().min(2).required().items(Joi.number())
            }),
            address: {
              en: Joi.string().required(),
              th: Joi.string().required()
            },
            phone: Joi.string().required(),
            city: Joi.string().required(),
            zip_code: Joi.string().required(),
            status: Joi.string().valid(['ACTIVE','INACTIVE']).required(),
            email: Joi.string().email().optional(),
            rating: Joi.number().min(0).optional(),
            pictures: Joi.array().items(Joi.string()).optional()
          }).required()
        },
        tags: ['api', 'shops'],
        description: 'Create shop data',
        notes: 'Create shop data'
      }
    },
    {
      method: 'PUT',
      path: '/shops/{id}',
      config: {
        auth: 'jwt',
        handler: ShopsController.update,
        validate: {
          params: {
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          },
          payload: Joi.object({
            name: Joi.object({
              en: Joi.string().min(3).required(),
              th: Joi.string().min(3).required()
            }).optional(),
            location: Joi.object({
              type: Joi.string().default('Point'),
              coordinates: Joi.array().items(Joi.number()).required()
            }).optional(),
            address: Joi.object({
              en: Joi.string().required(),
              th: Joi.string().required()
            }).optional(),
            phone: Joi.string().optional(),
            city: Joi.string().optional(),
            zip_code: Joi.string().optional(),
            status: Joi.string().valid(['ACTIVE', 'INACTIVE']).optional(),
            email: Joi.string().email().optional(),
            rating: Joi.number().min(0).optional(),
            pictures: Joi.array().items(Joi.string()).optional()
          })
        },
        tags: ['api', 'shops'],
        description: 'Update shop data by id',
        notes: 'Update shop data by id'
      }
    },
    {
      method: 'DELETE',
      path: '/shops/{id}',
      config: {
        auth: 'jwt',
        handler: ShopsController.delete,
        validate: {
          params: {
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          }
        },
        tags: ['api', 'shops'],
        description: 'Delete shop data by id',
        notes: 'Delete shop data by id'
      }
    }
  ]);
};
