var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UsersSchema = mongoose.Schema({
  email: {type: String},
  phone: {type: String},
  name: {type: String},
  username: {type: String},
  password: {type: String},
  email_verified: {type: Boolean, default: false},
  phone_verified: {type: Boolean, default: false},
  status: {type: String, default: 'ACTIVE', enum: ['ACTIVE', 'IN_ACTIVE', 'SUSPENDED']},
  fb_id: {type: String},
  google_id: {type: String},
  type: {
    type: String,
    required: true,
    enum: ['CUSTOMER', 'PROVIDER', 'ADMIN','SHOP_ADMIN']
  },
  auth_provider: {
    type: String,
    required: true,
    enum: ['PHONE','EMAIL','GOOGLE', 'FACEBOOK']
  },
  customer: {type: mongoose.Schema.Types.ObjectId, ref: 'customers'},
  provider: {type: mongoose.Schema.Types.ObjectId, ref: 'providers'},
  shop: {type: mongoose.Schema.Types.ObjectId, ref: 'shops'},
  created_at: {type: Date, default: Date.now},
}, {collection: 'users'});

UsersSchema.pre('save', function (next) {
  var user = this;
  if (!user.isModified('password')) return next();

  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);

    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);

      user.password = hash;
      next();
    });
  });
});
UsersSchema.methods.comparePassword = function (candidatePassword) {
  const promise = new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
      if (err) {
        return reject(err);
      }
      return resolve(isMatch);
    });
  })
  return promise;
};
UsersSchema.set('toObject', {
  transform: function(doc, ret, options) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('users', UsersSchema);
