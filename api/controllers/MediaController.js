'use strict';
const uploadService = require('../services/AmazonS3Service');
const Shops = require('../models/Shops');
const Deals = require('../models/Deals');
const Boom = require('boom');
const _ = require('underscore');
const uiid = require('node-uuid');
const controller = {};

controller.uploadImage = function (request, reply) {
  const imageFile = request.payload.image;
  const type = request.params.type;
  const uploadType = request.params.upload_type;
  const id = request.params.id;
  const model = controller.getModel(type);
  model.findOne({_id: id}).then((obj) => {

    if (!obj) {
      return reply(Boom.notFound());
    } else {
      if (imageFile) {
        let name = imageFile.filename && imageFile.filename.split('.');
        const key = request.params.type + '/' + request.params.id + '/' + uiid.v1() + '.' + name[name.length-1];
        uploadService
          .upload(imageFile.path, key, imageFile.bytes,(err, data) => {
            console.log(err);
            if (err) return reply(Boom.internal('Something went wrong!'));
            // Update document with path of the image
            if (type == 'SHOP' && uploadType == 'shop_logo') {
              obj.logo = `/${key}`;
            } else {
              obj.pictures = obj.pictures || [];
              obj.pictures.push(`/${key}`);
            }
            model.update({_id: id}, obj, (err, data) => {
              if (err) {
                return reply(Boom.internal());
              }
              return reply({success: true, path: `/${key}`});
            });
          });
      } else {
        reply({error: true, message: request.i18n.__('200_IMAGE_REQUIRED')});
      }
    }
  });
}

controller.deleteImage = function (request, reply) {
  const type = request.params.type;
  const uploadType = request.params.upload_type;
  const id = request.params.id;
  const path = request.params.path;
  const model = controller.getModel(type);

  model.findOne({_id: id}).then((obj) => {
    // Check if record exist
    if (!obj) {
      return reply(Boom.notFound());
    }
    // Check if path provided exist in record
    if (type == 'SHOP' && uploadType == 'shop_logo') {
      obj.logo =  '';
    } else {
      obj.pictures = _.without(obj.pictures || [], path);
    }
    uploadService.delete(path.replace('/', '')).then(() => {
      obj.save().then(() => {
        return reply({success: true});
      })
      .catch((err) => {
        return reply(Boom.internal());
      });
    })
    .catch((err) => {
      return reply(Boom.internal());
    })
  })
  .catch(() => {
    return reply(Boom.internal());
  });
};

controller.getModel = function (type) {
  switch(type) {
    case 'SHOP':
      return Shops;
    case 'DEAL':
      return Deals;
    default:
      return {};
  }
}

module.exports = controller;
