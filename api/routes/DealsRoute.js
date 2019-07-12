'use strict';
const Joi = require('joi');
const DealsController = require('../controllers/DealsController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/deals',
      config: {
        auth: 'jwt',
        handler: DealsController.getAll,
        validate: {
          query: {
            page: Joi.number(),
            limit: Joi.number(),
            shop_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
          }
        },
        tags: ['api', 'deals'],
        description: 'Get all deals based upon specific role',
        notes: 'Get all deals, API will automatically detect admin or provider & return deals according to specific role.'
      }
    },
    {
      method: 'GET',
      path: '/shops/{shop_id}/deals/{deal_id}',
      config: {
        auth: 'jwt',
        handler: DealsController.getOne,
        validate: {
          params: {
            shop_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
            deal_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          }
        },
        tags: ['api', 'deals'],
        description: 'Get deal based upon specific deal id',
        notes: 'Get deal by id'
      }
    },
    {
      method: 'POST',
      path: '/shops/{shop_id}/deals',
      config: {
        auth: 'jwt',
        handler: DealsController.create,
        validate: {
          params: {
            shop_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
          },
          payload: Joi.object({
            name: {
              en: Joi.string().min(3).required(),
              th: Joi.string().min(3).required()
            },
            description: {
              en: Joi.string().optional().default(''),
              th: Joi.string().optional().default('')
            },
            terms: {
              en: Joi.string().required(),
              th: Joi.string().required()
            },
            special_deal: Joi.boolean().required(),
            original_price: Joi.number().min(0).required(),
            gender: Joi.string().valid(['MALE','FEMALE','BOTH']),
            category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            age_range: Joi.object({
              max: Joi.number().max(100),
              min: Joi.number().min(0)
            }).optional(),
            availability: Joi.object({
              people_allow: Joi.number().required().min(1),
              status: Joi.string().valid(['ACTIVE', 'IN_ACTIVE']).default('ACTIVE'),
              days: Joi.number().required().min(3),
              disable_days: Joi.array().items(Joi.string().valid(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])),
              starting_date: Joi.string().required(),
              slots: Joi.array().items(Joi.object({
                start: Joi.number().required(),
                stop: Joi.number().required(),
                price: Joi.number().min(1).required(),
                seats: Joi.number().required(),
                disable_days: Joi.array().items(Joi.string().valid(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']))
              })).required()
            }).required(),
            pictures: Joi.array().items(Joi.string()).optional()
          }).required()
        },
        tags: ['api', 'deals'],
        description: 'Create deal data',
        notes: 'Create deal data'
      }
    },
    {
      method: 'PUT',
      path: '/shops/{shop_id}/deals/{deal_id}',
      config: {
        auth: 'jwt',
        handler: DealsController.update,
        validate: {
          params: {
            deal_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            shop_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
          },
          payload: Joi.object({
            name: Joi.object({
              en: Joi.string().min(3).required(),
              th: Joi.string().min(3).required()
            }).optional(),
            description: Joi.object({
              en: Joi.string().optional(),
              th: Joi.string().optional()
            }).optional(),
            terms: Joi.object({
              en: Joi.string().required(),
              th: Joi.string().required()
            }).optional(),
            original_price: Joi.number().min(0).optional(),
            special_deal: Joi.boolean().optional(),
            category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
            gender: Joi.string().valid(['MALE','FEMALE','BOTH']).optional(),
            rating: Joi.number().min(0).optional(),
            age_range: Joi.object({
              max: Joi.number().max(100),
              min: Joi.number().min(0)
            }).optional(),
            availability: Joi.object({
              people_allow: Joi.number().min(1),
              status: Joi.string().valid(['ACTIVE', 'IN_ACTIVE']).optional(),
              days: Joi.number().min(3),
              disable_days: Joi.array().items(Joi.string().valid(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])),
              starting_date: Joi.string(),
              slots: Joi.array().items(Joi.object({
                start: Joi.number().required(),
                stop: Joi.number().required(),
                price: Joi.number().min(1).required(),
                seats: Joi.number().required(),
                seats_available: Joi.number().required(),
                disable_days: Joi.array().items(Joi.string().valid(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])),
                _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/)
              })).optional()
            }),
            pictures: Joi.array().items(Joi.string()).optional(),
          })
        },
        tags: ['api', 'deals'],
        description: 'Update deal data by id',
        notes: 'Update deal data by id'
      }
    },
    {
      method: 'DELETE',
      path: '/shops/{shop_id}/deals/{deal_id}',
      config: {
        auth: 'jwt',
        handler: DealsController.delete,
        validate: {
          params: {
            deal_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            shop_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
          }
        },
        tags: ['api', 'deals'],
        description: 'Delete deal data by id',
        notes: 'Delete deal data by id'
      }
    }
  ]);
};
