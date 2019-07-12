'use strict';
var mongoose = require('mongoose');

var Deals = mongoose.Schema({
  name: {
    en: {type: String, required: true},
    th: {type: String, required: true}
  },
  description: {
    en: {type: String},
    th: {type: String}
  },
  terms: {
    en: {type: String, required: true},
    th: {type: String, required: true}
  },
  original_price: {type: Number, required: true},
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'BOTH'],
    default: 'BOTH'
  },
  availability: {
    status: {type: String, enum: ['ACTIVE', 'IN_ACTIVE'], default: 'ACTIVE'},
    people_allow: {type: Number, required: true, default: 1},
    days: {type: Number, required: true, default: 3},
    disable_days: [{type: String, enum:['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']}],
    starting_date: {type: Date, default: new Date(), required: true},
    slots: [{
      start: {type: Number, required: true},
      stop: {type: Number, required: true},
      price: {type: Number, required: true},
      seats: {type: Number, required: true},
      seats_available: {type: Number, required: true},
      discount: {type: Number, required: true},
      disable_days: [{type: String, enum:['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']}]
    }]
  },
  special_deal: {type: Boolean, default: false},
  shop: {type: mongoose.Schema.Types.ObjectId, ref: 'shops', required: true},
  category: {type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true},
  reviews: [
    {
      reviewed_by: {type: mongoose.Schema.Types.ObjectId, ref: 'customers', required: true},
      rating: {type: Number, required: true},
      review: {type: String, required: true},
      status: {type: String, enum: ['APPROVED', 'PENDING', 'ARCHIVED'], default: 'PENDING'},
      timestamp: {type: Date, default: new Date()}
    }
  ],
  rating: {type: Number},
  pictures: [{type: String}],
  max_discount: {type: Number, required: true},
  min_discount: {type: Number, required: true},
  age_range: {
    max: {type: Number, default: 100},
    min: {type: Number, default: 0}
  },
  created_at: {type: Date, default: new Date()},
  updated_at: {type: Date, default: new Date()},
  created_by: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true}
});

module.exports = mongoose.model('deals', Deals);
