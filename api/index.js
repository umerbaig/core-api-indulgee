const AuthRoute = require('./routes/AuthRoute');
const CustomersRoute = require('./routes/CustomersRoute');
const ProvidersRoute = require('./routes/ProvidersRoute');
const DealsRoute = require('./routes/DealsRoute');
const ShopsRoute = require('./routes/ShopsRoute');
const MediaRoute = require('./routes/MediaRoute');
const CategoriesRoute = require('./routes/CategoriesRoute');
const OrdersRoute = require('./routes/OrderRoutes');
const ShopAdminsRoute = require('./routes/ShopAdminRoutes');

exports.register = (plugin, options, next) => {
  // Register all routes
  AuthRoute(plugin, options, next);
  ProvidersRoute(plugin, options, next);
  CustomersRoute(plugin, options, next);
  DealsRoute(plugin, options, next);
  ShopsRoute(plugin, options, next);
  MediaRoute(plugin, options, next);
  CategoriesRoute(plugin, options, next);
  OrdersRoute(plugin, options, next);
  ShopAdminsRoute(plugin, options, next);

  next();
};

exports.register.attributes = {
  name: 'api'
};
