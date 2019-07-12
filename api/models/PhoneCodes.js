var mongoose = require('mongoose');

var PhoneCodes = mongoose.Schema({
  phone_number: {type: String, required: true, unique: false, index: false},
  code: {type: String, required: true, unique: true},
  ver_type: {
    type: String,
    required: true,
    default: 'SIGN_UP',
    enum: ['SIGN_UP', 'RESET_PASS', 'VERIFY_OAUTH_SIGNUP', 'CHANGE_PHONE']
  }, //verification type
  created_at: {type: Date, default: new Date()}
});

module.exports = mongoose.model('phone_codes', PhoneCodes);
