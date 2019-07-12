var mongoose = require('mongoose');

var Providers = mongoose.Schema({
  name: {type: String, required: true},
  phone: {type: String},
  email: {type: String, required: true},
  shops: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'shops'
  }],
  active: {type: Boolean, default: true},
  created_at: {type: Date, default: new Date()},
});

module.exports = mongoose.model('providers', Providers);
