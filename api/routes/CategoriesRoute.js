const Joi = require('joi');
const CategoriesController = require('../controllers/CategoriesController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/categories',
      config: {
        auth: false,
        handler: CategoriesController.getAll,
        validate: {
          query: {
            page: Joi.number(),
            limit: Joi.number()
          },
        },
        tags: ['api', 'categories'],
        description: 'Get all categories',
        notes: 'Get all categories'
      }
    },
    {
      method: 'GET',
      path: '/categories/special_deal_count',
      config: {
        auth: false,
        handler: CategoriesController.getSpecialDealCount,
        validate: {
          query: {
            special_deal: Joi.boolean().optional(),
            special_deal_id: Joi.boolean().optional()
          }
        },
        tags: ['api', 'categories'],
        description: 'Get Special Deal Count',
        notes: 'Get Special Deal Count'
      }
    }
  ]);
  server.route([
    {
      method: 'POST',
      path: '/categories',
      config: {
        auth: 'jwt',
        handler: CategoriesController.create,
        validate: {
          payload: {
            name: {
              en: Joi.string().required(),
              th: Joi.string().required()
            },
            description: {
              en: Joi.string().required(),
              th: Joi.string().required()
            },
            picture: Joi.string().required()
          }
        }
      }
    }
  ]);
};
