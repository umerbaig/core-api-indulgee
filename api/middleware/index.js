const AuthMiddleware = require('./AuthMiddleware');
const SocialOAuthMiddleware = require('./SocialOAuthMiddleware');

exports.register = (server, options, next) => {
  // Register all middlewares
  AuthMiddleware(server, options, next);
  SocialOAuthMiddleware(server, options, next);
  next();
};

exports.register.attributes = {
  name: 'middlware'
};
