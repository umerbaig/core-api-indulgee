const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.emailUser || 'indulgee007@gmail.com',
    pass: process.env.emailPassword || 'alright12345'
  }
});

const emailTypes = {
  signup: {
    subject: 'Thankyou for Signing up on Indulgee',
    filename: 'signup.html'
  },
  assigned: {
    subject: 'Tienes un nuevo servicio asignado',
    filename: 'cleaner-assigned.html'
  },
  reset_password: {
    subject: 'Reset your password',
    filename: 'reset.html'
  },
  create_order: {
    subject: 'Order Created',
    filename: 'create-order.html'
  },
  cancel_order: {
    subject: 'Order Canceled',
    filename: 'cancel-order.html'
  }
};

module.exports.sendMail = function (obj, to, type) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path.resolve('./templates/' + emailTypes[type].filename), "utf-8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        let html = data;
        if (type === 'signup' || type === 'reset_password') {
          html = html.replace('####NAME####', obj.name);
          html = html.replace(new RegExp('####CODE####', 'g'), obj.code);
        } else if (type === 'cancel-order') {
          html = html.replace(new RegExp('####ORDER_ID####', 'g'), obj.id);
          html = html.replace('####DATE####', obj.date);
          html = html.replace('####NAME####', obj.name);
        } else if (type === 'create_order') {
          html = html.replace('####ORDER_ID####', obj.order_id);
          html = html.replace('####CUSTOMER_NAME####', obj.name);
          html = html.replace('####PHONE####', obj.phone);
          html = html.replace('####DEAL_NAME####', obj.deal_name);
          html = html.replace('####SHOP_NAME####', obj.shop_name);
          html = html.replace('####PRICE####', obj.price);
          html = html.replace('####PEOPLE_ALLOW####', obj.people_allow);
          html = html.replace('####TIME_SLOT####', obj.time_slot);
          html = html.replace('####BOOKING_CREATION_DATE####', obj.booking_creation_date);
          html = html.replace('####BOOKING_DATE####', obj.booking_date);
        } else if (type === 'cancel_order') {
          html = html.replace('####ORDER_ID####', obj.order_id);
          html = html.replace('####CUSTOMER_NAME####', obj.name);
          html = html.replace('####PHONE####', obj.phone);
          html = html.replace('####DEAL_NAME####', obj.deal_name);
          html = html.replace('####SHOP_NAME####', obj.shop_name);
          html = html.replace('####PRICE####', obj.price);
          html = html.replace('####PEOPLE_ALLOW####', obj.people_allow);
          html = html.replace('####TIME_SLOT####', obj.time_slot);
          html = html.replace('####BOOKING_CREATION_DATE####', obj.booking_creation_date);
          html = html.replace('####BOOKING_DATE####', obj.booking_date);
        }
        const mailOptions = {
          from: 'Indulgee <support@indulgee.com>',
          to: to,
          subject: emailTypes[type].subject,
          html: html
        };
        transporter.sendMail(mailOptions, function(error, info){
          if(error) {
            console.log(error);
            reject(error);
          } else {
            resolve(info);
          }
        });
      }
    });
  });
};
