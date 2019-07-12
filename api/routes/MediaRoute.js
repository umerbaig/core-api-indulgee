'use strict';
const Joi = require('joi');
const MediaController = require('../controllers/MediaController');
const maxBytes = require('../../config/development.json').maxBytes;

module.exports = function (server, options, next) {

  server.route([
    {
      method: 'POST',
      path: '/media/upload_image/{type}/{id}/{upload_type}',
      config: {
        auth: 'jwt',
        handler: MediaController.uploadImage,
        payload: {
          maxBytes: maxBytes, //5MB max
          output: 'file',
          parse: true
        },
        validate: {
          params: {
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            type: Joi.string().valid(['SHOP', 'DEAL', 'CUSTOMER']).required(),
            upload_type: Joi.string().valid('shop_logo', 'pictures').required()
          },
          payload: {
            image: Joi.object()
          }
        },
        tags: ['api', 'media'],
        description: 'Upload image to the AWS S3 storage & return path of the image als updates the document with image',
        notes: 'Upload image to the AWS S3 storage & return path of the image, max size of the image is 5mb'
      }
    },
    {
      method: 'DELETE',
      path: '/media/delete_image/{type}/{id}/{path}/{upload_type}',
      config: {
        auth: 'jwt',
        handler: MediaController.deleteImage,
        validate: {
          params: {
            id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            type: Joi.string().valid(['SHOP', 'DEAL', 'CUSTOMER']).required(),
            path: Joi.string().required(),
            upload_type: Joi.string().valid('shop_logo', 'pictures').required()
          }
        },
        tags: ['api', 'media'],
        description: 'Deletes image from respective collection if path exist in the document that relates with id provided',
        notes: 'Deletes image from S3 bucket and from the document itself'
      }
    }
  ]);
};
