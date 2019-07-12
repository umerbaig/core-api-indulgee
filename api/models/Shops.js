'use strict';
var mongoose = require('mongoose');

var Shops = mongoose.Schema({
  name: {
    en: {type: String, required: true},
    th: {type: String, required: true}
  },
  location: {
    type: {type: String, enum: "Point", default: "Point"},
    coordinates: { type: [Number], default: [0,0] }
  },
  address: {
    en: {type: String, required: true},
    th: {type: String, required: true}
  },
  phone: {type: String, required: true},
  city: {type: String, required: true},
  zip_code: {type: String, required: true},
  provider: {type: mongoose.Schema.Types.ObjectId, ref: 'providers', required: true},
  status: {type: String, enum : ['ACTIVE', 'INACTIVE'], default: 'ACTIVE'},
  deals: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'deals'
  }],
  shop_admins: [{type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
  email: {type: String},
  rating: {type: Number, default: 0},
  logo: {type: String, default: ''},
  pictures: [{type: String}],
  created_at: {type: Date, default: new Date()},
  updated_at: {type: Date, default: new Date()},
  created_by: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}
});

Shops.index({location: '2dsphere'});

module.exports = mongoose.model('shops', Shops);
