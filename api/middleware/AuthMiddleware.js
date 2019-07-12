var jwtConfig = require('../../config/jwt.json')
var Users = require('../models/Users')

module.exports = function (server, options, next) {

  server.auth.strategy('jwt', 'jwt', {
    key: jwtConfig.secret,
    verifyOptions: {
      algorithms: ['HS256'],
      tokenType: 'Bearer'
    },
    validateFunc: (decoded, request, callback) => {
      Users
        .findOne({_id: decoded.id, status: 'ACTIVE'})
        .exec()
        .then((User) => {
          if (!User) {
            return callback(null, false);
          } else {
            request.isAuth = true;
            request.role = User.type;
            request.user = User._id;
            if (User.type === 'CUSTOMER') {
              request.customerId = User.customer;
            } else if (User.type === 'PROVIDER') {
              request.providerId = User.provider;
            } else if (User.type === 'SHOP_ADMIN') {
              request.shop = User.shop;
            }
            return callback(null, true);
          }
        }, (err) => {
          callback(err, false);
        });

    }
  });
  server.auth.default('jwt');
  next();
};
