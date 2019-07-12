const PhoneCodes = require('../models/PhoneCodes');
const twilio = require('twilio');

var service = {};

/**
 * Create a phone verification code for the given phone number
 * with the given verification type.
 * The generated code has 6 digits.
 * @param number
 * @param verificationType ['SIGN_UP', 'FORGOT_PASS', 'VERIFY_OAUTH_SIGNUP']
 */
service.createPhoneCode = function(number, verificationType, request) {
  const accountSid = 'ACee2a47b188b49c660714d99a2ffc7d70';
  const authToken = '9092b23fc7ecb3ca6e9755b8e29b42a3';
  const code = service.generateRandomCode().toString();
  const promise = new Promise((resolve, reject) => {
    // first remove all previous codes associated with this phone and type
    PhoneCodes.remove({ver_type: verificationType, phone_number: number}).exec().then(() => {
      PhoneCodes.create({
        code: code,
        phone_number: number,
        ver_type: verificationType,
        created_at: new Date()
      })
      .then(() => {
        const client = new twilio(accountSid, authToken);
        client.messages.create({
          body: request.i18n.__('200_VERIFICATION_CODE').replace('#CODE#', code),
          to: number,  // Text this number
          from: '+18333379111' // From a valid Twilio number
        })
        .then((message) => {
          console.log(message.sid)
          return resolve({message, code});
        })
        .catch((err) => {
          console.log(err);
          return reject(err);
        });
      })
      .catch((err1) => {
        return reject(err1);
      });
    })
    .catch(reject);
  });
  return promise;
};

/**
 * Send SMS with to the given number with message
 * @param message
 * @param number
 */

service.sendSMS = function (message, number) {
  const accountSid = 'ACee2a47b188b49c660714d99a2ffc7d70';
  const authToken = '9092b23fc7ecb3ca6e9755b8e29b42a3';
  const promise = new Promise((resolve, reject) => {
    const client = new twilio(accountSid, authToken);
    client.messages.create({
      body: message,
      to: number,  // Text this number
      from: '+18333379111' // From a valid Twilio number
    }).then((message) => {
      console.log(message.sid)
      return resolve({message});
    }).catch((err) => {
      console.log(err);
      return reject(err);
    });
  });
  return promise;
}

/**
 * Find a phone verification code for the given phone number.
 * @param number
 * @param type ['SIGN_UP', 'RESET_PASS', 'VERIFY_OAUTH_SIGNUP']
 * @param code
 */
service.verifyCode = function(number, type, code) {
  const promise = new Promise((resolve, reject) => {

    PhoneCodes.findOne({ phone_number: number, ver_type: type })
      .then((codeObj) => {
        if (!codeObj) {
          return reject('Phone number or code doesn\'t exist');
        } else {
          var createdDate = new Date(codeObj.created_at).valueOf();
          var dateNow = Date.now();
          var diff = (dateNow - createdDate) / 1000; //converting to seconds
          if (diff > 121) { // 2mins
            return reject('Please try creating new code, this code has been expired');
          }
          if (codeObj.code != code) {
            return reject('Please try again, this code didn\'t match with the code sent');
          }
          // all is well, we can proceed and remove the code
          PhoneCodes.remove({ number: number, ver_type: type });
          resolve(codeObj);
        }
      })
      .catch((err) => {
        console.log(err)
        reject('Something went wrong on our side');
      });
  });
  return promise;
};

/**
 * Generates a random number of 4 digits
 * @returns {number}
 */
service.generateRandomCode = function() {
  return Math.floor(1000 + Math.random() * 9000);
};

module.exports = service;
