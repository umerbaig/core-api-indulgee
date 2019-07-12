'use strict';
var mongoose = require('mongoose');

var OrdersSchema = mongoose.Schema({
  order_id: {type: Number, required: true, unique: true},
  payment_method: {type: String, enum: ['CASH', 'CARD', 'INTERNET_BANKING'], required: true, default: 'CASH'},
  original_price: {type: Number, required: true},
  final_price: {type: Number},
  people_allow: {type: Number},
  slot: {
    start: {type: Number, required: true},
    stop: {type: Number, required: true},
    price: {type: Number, required: true}
  },
  provider: {type: mongoose.Schema.Types.ObjectId, ref: 'providers'},
  status: {type: String, required: true, enum: ['PENDING','ORDERED','COMPLETED','CANCELED', 'RATED', 'CONFIRMED']},
  rating: {type: Number},
  note: {type: String},
  deal: {type: mongoose.Schema.Types.ObjectId, ref: 'deals'},
  customer: {type: mongoose.Schema.Types.ObjectId, ref: 'customers'},
  shop: {type: mongoose.Schema.Types.ObjectId, ref: 'shops'},
  booking_date: {type: Date},
  created_at: {type: Date, default: Date.now},
  created_by: {type: mongoose.Schema.Types.ObjectId, ref: 'customers'},
  updated_at: {type: Date, default: Date.now},
  updated_by: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}
}, {collection: 'orders'});

OrdersSchema.pre('validate', function(next, done) {
  var doc = this;
  if(!doc.isNew) return next();
  Orders
    .findOne({})
    .select('order_id')
    .sort('-order_id')
    .exec()
    .then((order) => {
      doc.order_id = (order && order.order_id) ? parseInt(order.order_id) + 1 : 10001;
      next();
    })
    .catch((err) => {
      if (err) next(err);
    });
});
var Orders = mongoose.model('orders', OrdersSchema);
module.exports = Orders;
