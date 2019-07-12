var mongoose = require('mongoose');

var Customers = mongoose.Schema({
  name: {type: String, required: true},
  phone: {type: String},
  email: {type: String},
  age: {type: Number},
  // omise_customer_id: {type: String},
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE']
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'orders'
  }],
  notifications: [{
    title: {
      en: {type: String, required: true},
      th: {type: String, required: true}
    },
    detail: {
      en: {type: String, required: true},
      th: {type: String, required: true} 
    },
    type: {
      type: String,
      enum: ['ORDER', 'DEAL'],
      required: true
    },
    un_read: {type: Boolean, default: true},
    entity_id: {type: String},
    timestamp: {type: Date, default: new Date().toISOString()}
  }],
  income: {type: Number, default: null},
  sms: {type: Boolean, default: true},
  push_notifications: {type: Boolean, default: true},
  address: {type: String, default: null},
  zip_code: {type: String, default: null},
  city: {type: String},
  money_spent: {type: Number, default: null},
  points: {type: Number, default: null},
  level: {type: String, default: null},
  profile_picture: {type: String, default: null},
  created_at: {type: Date, default: new Date()},
});

module.exports = mongoose.model('customers', Customers);
