const { IncomingWebhook } = require('@slack/client');
const url = require('../../config/development.json').slack_order_webhook;
const webhook = new IncomingWebhook(url);

let Service = {};

Service.createCancelOrder = function(obj) {
  const promise = new Promise((resolve, reject) => {
    // Send simple text to the webhook channel
    webhook.send(obj, function(err, res) {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
  promise;
};

Service.createCancelOrderTemplate = function(order, type) {
  const payload = {
    "text": `Order ${type} | Order ID: ${order.order_id}`,
    "attachments": [
      {
        "title": `Customer Name: ${order.name}`
      },
      {
        "title": `Phone: ${order.phone}`
      },
      {
        "title": `Deal Name: ${order.deal_name}`
      },
      {
        "title": `Shop Name: ${order.shop_name}`
      },
      {
        "title": `Time Slot: ${order.time_slot}`
      },
      {
        "title": `Price: ${order.price}`
      },
      {
        "title": `Max People Allow: ${order.people_allow}`
      },
      {
        "title": `Booking Date: ${order.booking_date}`
      },
      {
        "title": `Booking Creation Date: ${order.booking_creation_date}`
      }
    ]
  };
  return payload;
};

module.exports = Service;