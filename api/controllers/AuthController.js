'use strict';
const Customers = require('../models/Customers');
const Providers = require('../models/Providers');
const Users = require('../models/Users');
const PhoneCodes = require('../models/PhoneCodes');
const Shops = require('../models/Shops');
const JWT = require('jsonwebtoken');
const FB = require('fb');
const jwtConfig = require('../../config/jwt.json');
const OTPService = require('../services/OTPService');
const EmailService = require('../services/EmailService');
const Boom = require('boom');
var bcrypt = require('bcrypt');
const controller = {};

controller.signup = function (request, reply) {
  const phoneNumber = request.payload.phone_number;
  const password = request.payload.password;
  const name = request.payload.name;
  const type = request.payload.type;
  const code = request.payload.code;

  Users.findOne({phone: phoneNumber}).then((User) => {
    if (User) {
      return reply({error: true, message: request.i18n.__('200_USER_EXIST')});
    }

    OTPService.verifyCode(phoneNumber, 'SIGN_UP', code).then(() => {
      // Otherwise we're free to create new account
      // create respective data Object
      const model = new Customers({name, phone: phoneNumber});
      model.save().then((saveObj) => {
        const user = new Users({
          phone: phoneNumber,
          type,
          password: password,
          auth_provider: 'PHONE',
          phone_verified: true,
          [type.toLowerCase()]: saveObj._id
        });

        user.save().then(() => {
          return reply({success: true, message: request.i18n.__('200_USER_CREATED')});
        })
        .catch((err) => {
          model.remove();
          return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
        });
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
      });
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  })
};

controller.signupProvider = function (request, reply) {
  const email = request.payload.email;
  const password = request.payload.password;
  const name = request.payload.name;
  const username = request.payload.username;
  const code = Math.floor(1000 + Math.random() * 9000);
  // Check if anyone of them exists, separately with an OR.
  Users.findOne({
    $or: [
      {
        email
      },
      {
        username
      }
    ]
  })
  .then((User) => {
    if (User) {
      return reply({error: true, message: request.i18n.__('200_USER_EXIST_EMAIL')});
    }

    PhoneCodes.remove({ver_type: 'SIGN_UP', phone_number: email}).exec().then(() => {
      PhoneCodes.create({
        code: code,
        phone_number: email,
        ver_type: 'SIGN_UP',
        created_at: new Date()
      })
      .then(() => {
        const model = new Providers({name, email});
        model.save().then((saveObj) => {
          const user = new Users({
            name,
            username,
            email,
            type: 'PROVIDER',
            password: password,
            auth_provider: 'EMAIL',
            email_verified: false,
            provider: saveObj._id
          });
  
          user.save().then(() => {
            EmailService.sendMail({name, code}, email, 'signup');
            return reply({success: true, message: request.i18n.__('200_USER_CREATED')});
          })
          .catch((err) => {
            model.remove();
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          });
        })
        .catch((ee) => {
          console.log(ee);
          return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
        });
      })
      .catch((e) => {
        console.log(e);
        return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
      });
    })
    .catch(() => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
    });
  });
};

controller.verifyProvider = function (request, reply) {
  const {code, email} = request.payload;
  PhoneCodes
    .findOne({phone_number: email, code, ver_type: 'SIGN_UP',})
    .then((obj) => {
      if (obj) {
        // Means code found and is valid
        Users.findOneAndUpdate({email}, {email_verified: true}).then(() => {
          PhoneCodes.remove({ver_type: 'SIGN_UP', phone_number: email}).exec();
          return reply({success: true});
        })  
        .catch((e) => {
          console.log(e);
          return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
        });
      } else {
        return reply(Boom.notFound(request.i18n.__('404_CODE')));
      }
    })
    .catch((e) => {
      console.log(e);
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
};

controller.resetProviderPassword = function (request, reply) {
  const {email} = request.payload;
  const code = Math.floor(1000 + Math.random() * 9000);
  
  PhoneCodes.remove({ver_type: 'SIGN_UP', phone_number: email}).exec().then(() => {
    PhoneCodes.create({
      code: code,
      phone_number: email,
      ver_type: 'RESET_PASS',
      created_at: new Date()
    })
    .then(() => {
      EmailService.sendMail({code}, email, 'reset_password').then(() => {
        return reply({success: true});
      })
      .catch(() => {
        return reply(Boom.internal());
      });
    })
    .catch(() => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
    });
  })
  .catch(() => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
  });
};


controller.verifyResetProviderPassword = function (request, reply) {
  const {code, email, password} = request.payload;

  PhoneCodes
    .findOne({phone_number: email, code, ver_type: 'RESET_PASS',})
    .then((obj) => {
      if (obj) {
        // Means code found and is valid
        Users.findOne({email}).then((obj) => {
          if (obj) {
            hashPassword(password).then((pass) => {
              Users.findOneAndUpdate({email}, {password: pass}).then(() => {
                PhoneCodes.remove({ver_type: 'RESET_PASS', phone_number: email}).exec();
                return reply({success: true});
              })
              .catch((e) => {
                console.log(e);
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              });
            })
            .catch(() => {
              return reply(Boom.internal());
            });
            
          } else {
            return reply(Boom.notFound(request.i18n.__('404_CODE')));
          }
        })
        .catch(() => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
      } else {
        return reply(Boom.notFound(request.i18n.__('404_CODE')));
      }
    })
    .catch((e) => {
      console.log(e);
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
};

controller.signupShopAdmin = function (request, reply) {
  const phone = request.payload.phone_number;
  const username = request.payload.username;
  const password = request.payload.password;
  const name = request.payload.name;
  const shop = request.payload.shop;
  const provider = request.providerId;
  if (request.role === 'PROVIDER') {
    Users.findOne({username, phone}).then((User) => { // check if user already exist
      if (User) {
        return reply({error: true, message: request.i18n.__('200_USERNAME_EXIST')});
      }
      Shops.findOne({provider, _id: shop}).then((shop) => { // check if shop exists with given shop id
        // if all ok, then create shop admin
        const model = new Users({
          phone,
          name,
          username,
          password,
          type: 'SHOP_ADMIN',
          phone_verified: true,
          email_verified: true,
          auth_provider: 'PHONE',
          provider,
          shop,
        });
        model.save().then((saveObj) => {
          const doc = {
            shop_admins: shop.shop_admins,
            updated_at: new Date()
          };
          doc.shop_admins.splice(0,0, saveObj._id)
          Shops.update({_id: shop},doc, (err, sh) => {
            if (err) {
              return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
            }
            return reply({success: true, message: request.i18n.__('200_USER_CREATED')});
          });
        }).catch((err) => {
          model.remove();
          return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
        });
      }).catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      })
    }).catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
  } else {
    return reply(Boom.unauthorized());
  }
};

controller.login = function (request, reply) {
  const phone = request.payload.phone_number;
  const password = request.payload.password;
  const type = request.payload.type;
  Users
    .findOne({phone, type: 'CUSTOMER'})
    .populate(type.toLowerCase())
    .exec()
    .then((User) => {
      if (!User) {
        return reply({error: true, message: request.i18n.__('200_PASSWORD')});
      }
      if (User.status === 'SUSPENDED') {
        return reply({error: true, message: request.i18n.__('200_SUSPENDED')});
      }

      User.comparePassword(password).then((match) => {
        if (!match) {
          return reply({error: true, message: request.i18n.__('200_PASSWORD')});
        }
        let token = JWT.sign({
          id: User._id,
          role: User.type,
          phone: User.phone,
          phone_verified: User.phone_verified
        }, jwtConfig.secret, {
          expiresIn: jwtConfig.duration
        });
        let user = User.toObject();

        delete user.password;
        return reply({jwt: token, data: {
          [type.toLowerCase()]: User[type.toLowerCase()],
          role: User.type,
          phone: User.phone,
          phone_verified: User.phone_verified,
          auth_provider: User.auth_provider
        }});
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
    });
}
controller.loginAdmin = function (request, reply) {
  const username = request.payload.username;
  const password = request.payload.password;
  const findObj = {email_verified: true, type: {$ne: 'CUSTOMER'}};
  
  if (username.indexOf('@') >= 0) {
    findObj.email = username;
  } else {
    findObj.username = username;
  }

  Users
    .findOne(findObj)
    .exec()
    .then((User) => {
      if (!User) {
        return reply({error: true, message: request.i18n.__('200_PASSWORD')});
      }
      if (User.status === 'SUSPENDED') {
        return reply({error: true, message: request.i18n.__('200_SUSPENDED')});
      }

      User.comparePassword(password).then((match) => {
        if (!match) {
          return reply({error: true, message: request.i18n.__('200_PASSWORD')});
        }
        let token = JWT.sign({
          id: User._id,
          role: User.type,
          phone: User.phone,
          username: User.username,
          shop: User.shop,
          phone_verified: User.phone_verified
        }, jwtConfig.secret, {
          expiresIn: jwtConfig.duration
        });
        let user = User.toObject();

        delete user.password;
        return reply({jwt: token, data: {
          role: User.type,
          phone: User.phone,
          username: User.username,
          shop: User.shop,
          phone_verified: User.phone_verified
        }});
      })
        .catch((err) => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
    });
}

controller.authWithFacebook = function (request, reply) {
  const {access_token} = request.payload;

  FB.setAccessToken(access_token);
  FB.api('/me', { fields: ['id', 'name', 'email', 'first_name', 'last_name'] }, function (profile) {
    if(!profile || profile.error) {
      console.log(!profile ? 'error occurred' : profile.error);
      return reply({error: true, message: profile.error && profile.error.message});
    }
    const user = {
      fb_id: profile.id,
      type: 'CUSTOMER',
      auth_provider: 'FACEBOOK'
    };
    const customer = {
      name: profile.name || (`${profile.first_name} ${profile.last_name}`),
      profile_picture: `https://graph.facebook.com/${profile.id}/picture?type=large`
    };
    
    if (profile.email) {
      customer.email = profile.email;
      user.email = profile.email;
    }

    Users
      .findOne({fb_id: profile.id})
      .populate('customer')
      .then((User) => {
        if (User) {
          // User found, just log him in
          return loginUserWithSocial(request, reply, User, true);
        }
        // Otherwise we're free to create new account
        // create customer Object
        const userObj = new Users(user);
        const customerObj = new Customers(customer);
        customerObj.save().then((Customer) => {
          userObj.customer = Customer._id;

          userObj.save().then((User) => {
            User.customer = Customer;
            return loginUserWithSocial(request, reply, User, true);
          })
          .catch((err) => {
            customer.remove();
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          });
        })
        .catch((err) => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
        });
      });
  });
};

controller.authWithGoogle = function (request, reply) {
  if (!request.auth.isAuthenticated) {
    return reply({error: true, message: request.auth.error && request.auth.error.message});
  }
  const credentials = request.auth.credentials;
  if (credentials && credentials.profile) {
    const profile = credentials.profile;
    const rawProfile = profile.raw;
    const user = {
      google_id: profile.id,
      type: 'CUSTOMER',
      auth_provider: 'GOOGLE'
    };
    const customer = {
      name: profile.displayName
    }
    if (rawProfile && rawProfile.picture) {
      customer.profile_picture = rawProfile.picture;
    }
    if (rawProfile && rawProfile.gender) {
      customer.gender = rawProfile.gender.toUpperCase();
    }
    if (profile.email) {
      customer.email = profile.email;
      user.email = profile.email;
    }

    Users
      .findOne({google_id: profile.id})
      .populate('customer')
      .then((User) => {
        if (User) {
          // User found, just log him in
          return loginUserWithSocial(request, reply, User);
        }
        // Otherwise we're free to create new account
        // create customer Object
        const userObj = new Users(user);
        const customerObj = new Customers(customer);
        customerObj.save().then((Customer) => {
          userObj.customer = Customer._id;

          userObj.save().then((User) => {
            User.customer = Customer;
            return loginUserWithSocial(request, reply, User);
          })
          .catch((err) => {
            customer.remove();
            return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
          });
        })
        .catch((err) => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
        });
      });
  } else {
    return reply(Boom.internal(request.i18n.__('500_SOMETHING_WRONG')));
  }
}

controller.savePhone = function (request, reply) {
  const code = request.payload.code;
  const password = request.payload.password;
  const phone = request.payload.phone_number;
  Users.findOne({_id: request.user}).then((User) => {
    if (!User) {
      return reply(Boom.notFound());
    }
    OTPService
      .verifyCode(phone, 'VERIFY_OAUTH_SIGNUP', code)
      .then((phoneCodeObj) => {
        hashPassword(password).then((hashPassword) => {
          const doc = {
            phone,
            password: hashPassword,
            phone_verified: true
          };
          Customers.update({_id: User.customer}, {phone}, (err, res) => {
            if (err) {
              return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
            }
            Users
            .update({_id: User._id}, doc, (err, res) => {
              if (err) {
                return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
              }
              reply({success: true, message: request.i18n.__('200_PHONE_SAVED')});
            });
          });
        }).catch((err) => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
      })
      .catch((err) => {
        return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
      });
  })
  .catch((err) => {
    return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
  });
}

controller.sendCode = function (request, reply) {
  OTPService.createPhoneCode(request.payload.phone_number, request.params.type, request).then((res) => {
    reply({
      success: true, code: res.code,
      message: request.i18n.__('200_CODE_SENT')
    });
  })
  .catch((error) => {
    reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
  });
}

controller.resetPassword = function (request, reply) {
  OTPService
    .verifyCode(request.payload.phone_number, 'RESET_PASS',
      request.payload.code)
    .then((phoneCodeObj) => {
      Users
        .findOne({phone: request.payload.phone_number})
        .then((User) =>{
          if (!User) {
            return reply({error: true, message: request.i18n.__('200_NO_CUSTOMER')});
          }
          hashPassword(request.payload.password).then((hashPassword) => {
            const doc = {
              password: hashPassword
            };
            Users
              .update({_id: User._id}, doc, (err, res) => {
                if (err) {
                  return reply(Boom.internal(request.i18n.__('500_MONGO_WRITE')));
                }
                reply({success: true, message: request.i18n.__('200_PASSWORD_SAVED')});
              });
          }).catch((err) => {
            return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
          });
        })
        .catch((err) => {
          return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
        });
    })
    .catch((err) => {
      return reply(Boom.internal(request.i18n.__('500_MONGO_READ')));
    });
}

function loginUserWithSocial(request, reply, User, json) {
  let token = JWT.sign({
    id: User._id,
    customer_id: User.customer._id,
    role: User.type,
    provider: User.auth_provider,
    phone: User.phone,
    phone_verified: User.phone_verified
  }, jwtConfig.secret, {
    expiresIn: jwtConfig.duration
  });
  let user = User.toObject();

  delete user.password;
  if (json) {
    return reply({
      jwt: token,
      data: {
        customer: User.customer,
        role: User.type,
        phone: User.phone,
        phone_verified: User.phone_verified
      }
    });
  } else {
    return reply.redirect(`indulgeeLogin://auth?user=${
      JSON.stringify({
        jwt: token,
        data: {
          customer: User.customer,
          role: User.type,
          phone: User.phone,
          phone_verified: User.phone_verified
        }
      })
    }`);
  }
}

function hashPassword(password) {
  const promise = new Promise((resolve, reject) => {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) return reject(err);

      // hash the password along with our new salt
      bcrypt.hash(password, salt, function (err, hash) {
        if (err) return reject(err);
        // if all is ok then return hash password
        resolve(hash);
      });
    });
  });
  return promise;
}
module.exports = controller;
