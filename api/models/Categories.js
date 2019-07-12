'use strict';
var mongoose = require('mongoose');

var Categories = mongoose.Schema({
  name: {
    en: {type: String, required: true},
    th: {type: String, required: true}
  },
  description: {
    en: {type: String, default: ''},
    th: {type: String, default: ''} 
  },
  picture: {type: String, default: ''},
  availability: {type: Boolean, default: false},
  created_at: {type: Date, default: new Date()}
});

module.exports = mongoose.model('categories', Categories);
