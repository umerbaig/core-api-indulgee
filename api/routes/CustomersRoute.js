const Joi = require('joi');
const CustomersController = require('../controllers/CustomersController');

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/customers',
      config: {
        auth: 'jwt',
        handler: CustomersController.getAll,
        validate: {
          query: {
            page: Joi.number(),
            limit: Joi.number()
          },
        },
        tags: ['api', 'customers'],
        description: 'Get all Customers',
        notes: 'Get all customers'
      }
    },
    {
      method: 'GET',
      path: '/customers/settings',
      config: {
        auth: 'jwt',
        handler: CustomersController.getCustomer,
        tags: ['api', 'customers'],
        description: 'Get customer by id',
        notes: 'Get customer by id'
      }
    },
    {
      method: 'GET',
      path: '/customers/shops',
      config: {
        auth: false,
        handler: CustomersController.getShops,
        tags: ['api', 'customers'],
        description: 'Get customer shops',
        notes: 'Get customer shops'
      }
    },
    {
      method: 'PUT',
      path: '/customers/settings',
      config: {
        auth: 'jwt',
        handler: CustomersController.updateCustomer,
        validate: {
          payload: {
            name: Joi.string().min(3).max(25).optional(),
            email: Joi.string().email().optional(),
            sms: Joi.boolean().optional(),
            push_notifications: Joi.boolean().optional()
          }
        },
        tags: ['api', 'customers'],
        description: 'Update customer data',
        notes: 'Update customer data'
      }
    },
    {
      method: 'PUT',
      path: '/customers/update_phone',
      config: {
        handler: CustomersController.updatePhone,
        auth: 'jwt',
        validate: {
          payload: {
            code: Joi.string().required(),
            phone_number: Joi.string().required(),
          }
        },
        tags: ['api', 'customers'],
        description: 'Update customer phone number',
        notes: 'Update customer phone number'
      }
    },
    {
      method: 'GET',
      path: '/customers/notifications/un_read_count',
      config: {
        auth: 'jwt',
        handler: CustomersController.unreadNotificationsCount,
        tags: ['api', 'customers'],
        description: 'Gets unread notifications count for customer',
        notes: 'Gets unread notifications count for customer'
      }
    },
    {
      method: 'PUT',
      path: '/customers/notifications/mark_read',
      config: {
        auth: 'jwt',
        handler: CustomersController.markNotificationsRead,
        tags: ['api', 'customers'],
        description: 'Marks unread notifications as read for customer',
        notes: 'Marks unread notifications as read for customer'
      }
    },
    {
      method: 'GET',
      path: '/customers/notifications',
      config: {
        auth: 'jwt',
        handler: CustomersController.getNotifications,
        validate: {
          query: {
            page: Joi.number(),
            limit: Joi.number()
          },
        },
        tags: ['api', 'customers'],
        description: 'Get all notifications for customer',
        notes: 'Get all notifications for customer'
      }
    },
    {
      method: 'DELETE',
      path: '/customers/notifications/{notification_id}',
      config: {
        auth: 'jwt',
        handler: CustomersController.deleteNotification,
        validate: {
          params: {
            notification_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          }
        },
        tags: ['api', 'customers'],
        description: 'Delete notification for customer by id',
        notes: 'Delete notifications for customer by id'
      }
    },
    {
      method: 'PUT',
      path: '/customers',
      config: {
        auth: 'jwt',
        handler: CustomersController.update,
        validate: {
          payload: Joi.object({
            gender: Joi.string().valid(['MALE', 'FEMALE']).optional(),
            phone: Joi.string().optional(),
            name: Joi.string().min(3).max(25).optional(),
            email: Joi.string().email().optional(),
            profile_picture: Joi.string().optional(),
            city: Joi.string().optional(),
            address: Joi.string().optional(),
            zip_code: Joi.string().optional(),
            money_spent: Joi.number().optional(),
            income: Joi.number().optional(),
            age: Joi.number().optional(),
            points: Joi.number().optional(),
            level: Joi.string().optional()
          })
        },
        tags: ['api', 'customers'],
        description: 'Update Customers Data',
        notes: 'Update Customers Data'
      }
    },
    {
      method: 'GET',
      path: '/customers/deals',
      config: {
        auth: false,
        handler: CustomersController.getDeals,
        validate: {
          query: {
            category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
            special_deal: Joi.boolean().optional(),
            shop: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            page: Joi.number(),
            limit: Joi.number(),
            min_price: Joi.number().optional(),
            max_price: Joi.number().optional(),
            min_discount: Joi.number().optional(),
            max_discount: Joi.number().optional(),
            sort_by: Joi.string().valid(['rating', 'date', 'price'])
          }
        },
        tags: ['api', 'customers'],
        description: 'Get deals for Customers',
        notes: 'Get deals for customers'
      }
    },
    {
      method: 'GET',
      path: '/customers/deals/{deal_id}/reviews',
      config: {
        auth: false,
        handler: CustomersController.getDealReviews,
        validate: {
          params: {
            deal_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          }
        },
        tags: ['api', 'customers'],
        description: 'Get deal reviews for customer by deal id',
        notes: 'Get deal reviews for customer by deal id'
      }
    },
    {
      method: 'GET',
      path: '/customers/deals_near_me',
      config: {
        auth: false,
        handler: CustomersController.getDealsBySlotAndRadius,
        validate: {
          query: {
            category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
            start: Joi.number().required(),
            end: Joi.number().required(),
            radius: Joi.number().required(),
            lat: Joi.number().required(),
            lng: Joi.number().required(),
          }
        },
        tags: ['api', 'customers'],
        description: 'Get deals for Customers within some radius of the location',
        notes: 'Get deals for customers using location'
      }
    },
    {
      method: 'GET',
      path: '/customers/orders',
      config: {
        auth: 'jwt',
        handler: CustomersController.getOrders,
        validate: {
          query: {
            page: Joi.number(),
            limit: Joi.number()
          },
        },
        tags: ['api', 'customers'],
        description: 'Get orders for customer',
        notes: 'Get orders for customer'
      }
    },
    {
      method: 'GET',
      path: '/customers/orders/{order_id}',
      config: {
        auth: 'jwt',
        handler: CustomersController.getOrderById,
        validate: {
          params: {
            order_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          }
        },
        tags: ['api', 'customers'],
        description: 'Get order for customer by order id',
        notes: 'Get order for customer by order id'
      }
    },
    {
      method: 'POST',
      path: '/customers/orders/{order_id}/rate',
      config: {
        auth: 'jwt',
        handler: CustomersController.rateOrder,
        validate: {
          params: {
            order_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          },
          payload: {
            rating: Joi.number().required(),
            review: Joi.string().required()
          }
        },
        tags: ['api', 'customers'],
        description: 'Rate order of customer',
        notes: 'Rate order of customer'
      }
    },
    {
      method: 'GET',
      path: '/customers/add_card/{card_token}',
      config: {
        auth: 'jwt',
        handler: CustomersController.addCard,
        validate: {
          params: {
            card_token: Joi.string().required()
          }
        },
        tags: ['api', 'customers'],
        description: 'Add card of a customer',
        notes: 'Add card of a customer'
      }
    },
    {
      method: 'GET',
      path: '/customers/list_cards',
      config: {
        auth: 'jwt',
        handler: CustomersController.listCards,
        tags: ['api', 'customers'],
        description: 'List cards of a customer',
        notes: 'List cards of a customer'
      }
    },
    {
      method: 'GET',
      path: '/customers/retrieve_card/{card_id}',
      config: {
        auth: 'jwt',
        handler: CustomersController.retrieveCard,
        tags: ['api', 'customers'],
        description: 'Retrieve card of a customer',
        notes: 'Retrieve card of a customer'
      }
    },
    {
      method: 'DELETE',
      path: '/customers/destroy_card/{card_id}',
      config: {
        auth: 'jwt',
        handler: CustomersController.destroyCard,
        validate: {
          params: {
            card_id: Joi.string().required()
          }
        },
        tags: ['api', 'customers'],
        description: 'Destroy card of a customer',
        notes: 'Destroy card of a customer'
      }
    },
    {
      method: 'POST',
      path: '/customers/internet_banking/create_source',
      config: {
        auth: 'jwt',
        handler: CustomersController.createSource,
        validate: {
          payload: {
            type: Joi.string().valid(['internet_banking_bay', 'internet_banking_bbl', 'internet_banking_ktb', 'internet_banking_scb']).required(),
            amount: Joi.number().required(),
            order_id: Joi.number().required()
          }
        },
        tags: ['api', 'customers'],
        description: 'Create Internet Banking Source for customer',
        notes: 'Create internet banking source for customer'
      }
    },
    {
      method: 'GET',
      path: '/customers/internet_banking/retrieve_charge/{charge_id}',
      config: {
        auth: 'jwt',
        handler: CustomersController.retrieveCharge,
        validate: {
          params: {
            charge_id: Joi.string().required()
          }
        },
        tags: ['api', 'customers'],
        description: 'Retrieve charge for customer',
        notes: 'Retrieve charge for customer'
      }
    }
  ]);
};
