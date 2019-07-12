
module.exports = function (server, options, next) {

  server.auth.strategy('facebook', 'bell', {
    provider: 'facebook',
    scope: ['email', 'public_profile'],
    password: 'cookie_encryption_password_secure',
    clientId: '107940293251121',
    clientSecret: 'dc66cc3c7eefe692d920681121d41136',
    isSecure: false
  });

  server.auth.strategy('google', 'bell', {
    provider: 'google',
    password: 'asdlfjasnfklansflkasasdfasfasfsafafsdfaf',
    clientId: '317863405431-tf4kv0tkaubp5po17t0ol479ibpf6mij.apps.googleusercontent.com',
    clientSecret: 'GZ2wkjgl2lHt6-cvQyGYXrzp',
    isSecure: false
  });

  next();
};
