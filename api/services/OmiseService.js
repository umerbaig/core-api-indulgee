const secretKey = require('../../config/development.json').omise_secret_key;
const publicKey = require('../../config/development.json').omise_public_key;


const omise = require('omise')({
  'secretKey': secretKey,
  'omiseVersion': '2017-11-02'
});

const omiseInternetBanking = require('omise')({
  'publicKey': publicKey,
  'omiseVersion': '2017-11-02'
});

let service = {};

service.doPaymentWithCardToken = function(token, amount, orderID) {
  const promise = new Promise((resolve, reject) => {
    omise.charges.create({
      'description': `Charge for Order ID: ${orderID}`,
      'amount': amount*100, 
      'currency': 'thb',
      'capture': false,
      'card': token
    }, function(err, resp) {
      if (err) {
        return reject(err);
      }
      if (resp.paid) {
        //Success
        return resolve(resp);        
      } else if (resp.status === 'pending') {
        return resolve(resp);
      } else if (resp.failure_message) {
        return resolve(resp);
      }
    });
  });
  return promise;
};

service.doPaymentWithSavedCard = function(card_id, customer_id, amount, orderID) {
  const promise = new Promise((resolve, reject) => {
    omise.charges.create({
      'description': `Charge for Order ID: ${orderID}`,
      'amount': amount*100, 
      'currency': 'thb',
      'capture': false,
      'customer': customer_id,
      'card_id': card_id
    }, function(err, resp) {
      if (err) {
        return reject(err);
      }
      if (resp.paid) {
        //Success
        return resolve(resp);        
      } else if (resp.status === 'pending') {
        return resolve(resp);
      } else if (resp.failure_message) {
        return resolve(resp);
      }
    });
  });
  return promise;
};

service.createCustomerAndAttachCard = function(name) {
  const promise = new Promise((resolve, reject) => {
    const custObj = {
      'description': name,
    };
    omise.customers.create(custObj, function(err, customer) {
      if (err) {
        return reject(err);
      }
      return resolve({omise_customer_id: customer.id});
    });
  });
  return promise;
};

service.addCard = function(omise_customer_id, card_token) {
  const promise = new Promise((resolve, reject) => {
    omise.customers.update(omise_customer_id, {'card': card_token}, function(err, customer){
      if (err) {
        return reject(err);
      }
      return resolve({omise_customer_id: customer.id});
    });
  });
  return promise;
};

service.listCards = function(omise_customer_id) {
  const promise = new Promise((resolve, reject) => {
    omise.customers.listCards(omise_customer_id, function(err, cardList) {
      if (err) {
        return reject(err);
      }
      return resolve(cardList);
    });
  });
  return promise;
};

service.retrieveCard = function(omise_customer_id, card_id) {
  const promise = new Promise((resolve, reject) => {
    omise.customers.retrieveCard(omise_customer_id, card_id, function(error, card) {
      if (error) {
        return reject(error);
      }
      return resolve(card);
    });
  });
  return promise;
};

service.destroyCard = function(omise_customer_id, card_id) {
  const promise = new Promise((resolve, reject) => {
    omise.customers.destroyCard(omise_customer_id, card_id, function(error, card) {
      if (error) {
        return reject(error);
      }
      return resolve(card);
    });
  });
  return promise;
};

service.createSource = function(type, amount, orderID) {
  const promise = new Promise((resolve, reject) => {
    const source = {
      type, 
      amount: amount*100,
      currency: 'thb'
    };
    console.log(type, amount, orderID, 'dkdk');
    omiseInternetBanking.sources.create(source, function(err, resSource) {
      if (err) {  
        console.log(err, 'abc');
        return reject(err);
      }
      omise.charges.create({
        'description': `Charge for Order ID: ${orderID}`,
        'amount': amount*100, 
        'currency': 'thb',
        'source': resSource.id,
        'return_uri': 'http://www.example.com/orders/3947/complete'
      }, function(err, resp) {
        if (err) {
          console.log(err, 'cde');
          return reject(err);
        }
        return resolve(resp);
      });
    });
  });
  return promise;
};

service.retrieveCharge = function(chargeID) {
  const promise = new Promise((resolve, reject) => {
    omise.charges.retrieve(chargeID, function(err, res) {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
  return promise;
};

service.errorMessage = function(errCode) {
  let errMessageCode = '';
  if (errCode === 'expired_charge') {
    errMessageCode = '500_EXPIRED_CHARGE';
  } else if (errCode === 'failed_capture') {
    errMessageCode = '500_FAILED_CAPTURE';
  } else if (errCode === 'invalid_card_token') {
    errMessageCode = '500_INVALID_CARD';
  } else if (errCode === 'not_found') {
    errMessageCode = '500_OMISE_CUSTOMER_NOT_FOUND';
  } else if (errCode === 'used_token') {
    errMessageCode = '500_USED_TOKEN';
  } else if (errCode === 'service_not_found') {
    errMessageCode = '500_OMISE_SERVICE_NOT_FOUND';
  } else if (errCode === 'invalid_card') {
    errMessageCode = '500_INVALID_CARD';
  } else if (errCode === 'invalid_charge') {
    errMessageCode = '500_INVALID_CHARGE';
  } else {
    errMessageCode = '500_SOMETHING_WRONG';
  }
  return errMessageCode;
};

module.exports = service;


