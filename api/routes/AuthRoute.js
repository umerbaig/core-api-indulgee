const Joi = require('joi');
const AuthController = require('../controllers/AuthController');

module.exports = function (server, options, next) {

  server.route([

    {
      method: 'POST',
      path: '/auth/signup',
      config: {
        auth: false,
        handler: AuthController.signup,
        validate: {
          payload: {
            type: Joi.string().valid(['CUSTOMER']),
            code: Joi.number().required(),
            phone_number: Joi.string().required(),
            password: Joi.string().required(),
            name: Joi.string().optional(),
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs up customers and providers using phone',
        notes: 'Signs up customers and providers usign phone'
      }
    },
    {
      method: 'POST',
      path: '/auth/signup_provider',
      config: {
        auth: false,
        handler: AuthController.signupProvider,
        validate: {
          payload: {
            email: Joi.string().email(),
            password: Joi.string().required(),
            name: Joi.string().required(),
            username: Joi.string().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs up provider using username & phone',
        notes: 'Signs up provider using username & phone'
      }
    },
    {
      method: 'POST',
      path: '/auth/verify_provider',
      config: {
        auth: false,
        handler: AuthController.verifyProvider,
        validate: {
          payload: {
            email: Joi.string().email().required(),
            code: Joi.string().required().regex(/^[0-9]*$/).min(4).max(4),
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs up provider using username & phone',
        notes: 'Signs up provider using username & phone'
      }
    },
    {
      method: 'POST',
      path: '/auth/verify_provider_reset_password',
      config: {
        auth: false,
        handler: AuthController.verifyResetProviderPassword,
        validate: {
          payload: {
            email: Joi.string().email().required(),
            code: Joi.string().required().regex(/^[0-9]*$/).min(4).max(4),
            password: Joi.string().required().min(4).max(15),
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs up provider using username & phone',
        notes: 'Signs up provider using username & phone'
      }
    },
    {
      method: 'POST',
      path: '/auth/provider_reset_password',
      config: {
        auth: false,
        handler: AuthController.resetProviderPassword,
        validate: {
          payload: {
            email: Joi.string().email().required(),
          }
        },
        tags: ['api', 'auth'],
        description: 'Resets password of provider using email',
        notes: 'Resets password of provider using email'
      }
    },
    {
      method: 'POST',
      path: '/auth/signup_shop_admin',
      config: {
        auth: 'jwt',
        handler: AuthController.signupShopAdmin,
        validate: {
          payload: {
            phone_number: Joi.string().optional(),
            password: Joi.string().required(),
            name: Joi.string().optional(),
            username: Joi.string().required(),
            shop: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs up shop admin using username',
        notes: 'Signs up shop admin using username'
      }
    },
    {
      method: 'POST',
      path: '/auth/login',
      config: {
        auth: false,
        handler: AuthController.login,
        validate: {
          payload: {
            type: Joi.string().valid(['CUSTOMER']).required(),
            phone_number: Joi.string().optional(),
            password: Joi.string().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs in customers and providers using phone',
        notes: 'Signs in customers and providers usign phone'
      }
    },
    {
      method: 'POST',
      path: '/auth/login_admin',
      config: {
        auth: false,
        handler: AuthController.loginAdmin,
        validate: {
          payload: {
            username: Joi.string().required(),
            password: Joi.string().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Signs in providers & shop admins using phone',
        notes: 'Signs in providers & shop admins using phone'
      }
    },
    {
      method: 'POST',
      path: '/auth/send_code/{type}',
      config: {
        handler: AuthController.sendCode,
        auth: false,
        validate: {
          params: {
            type: Joi.string().valid(['SIGN_UP', 'RESET_PASS', 'VERIFY_OAUTH_SIGNUP', 'CHANGE_PHONE'])
          },
          payload: {
            phone_number: Joi.string().required(),
          }
        },
        tags: ['api', 'auth'],
        description: 'Send code to customers phone',
        notes: 'Sends code to customers phone'
      }
    },
    {
      method: 'POST',
      path: '/auth/oauth/auth_with_facebook',
      config: {
        auth: false,
        handler: AuthController.authWithFacebook,
        validate: {
          payload: {
            access_token: Joi.string().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Authenticate customers using facebook',
        notes: 'It will be used for logging in and signing up. Both has same endpoint, the api ' +
                'will automatically check and return the jwt to authorize the user.'
      }
    },
    {
      method: 'GET',
      path: '/auth/oauth/auth_with_google',
      config: {
        auth: 'google',
        handler: AuthController.authWithGoogle,
        tags: ['api', 'auth'],
        description: 'Authenticate customers using Google',
        notes: 'It will be used for logging in and signing up. Both has same endpoint, the api ' +
                'will automatically check and return the jwt to authorize the user.'
      }
    },
    {
      method: 'POST',
      path: '/auth/oauth/save_phone',
      config: {
        handler: AuthController.savePhone,
        auth: 'jwt',
        validate: {
          payload: {
            code: Joi.string().required(),
            password: Joi.string().required(),
            phone_number: Joi.string().required(),
          }
        },
        tags: ['api', 'auth'],
        description: 'Saves user phone & password & verifies user',
        notes: 'With oauth using facebook or google we dont have phone therefore we save it after' +
               ' user authenticates with facebook or google & verifies user'
      }
    },
    {
      method: 'PUT',
      path: '/auth/reset_password',
      config: {
        auth: false,
        handler: AuthController.resetPassword,
        validate: {
          payload: {
            code: Joi.string().required(),
            phone_number: Joi.string().required(),
            password: Joi.string().required()
          }
        },
        tags: ['api', 'auth'],
        description: 'Reset user password if code provided is valid',
        notes: 'Reset user password if code provided is valid'
      }
    }
  ]);
};
