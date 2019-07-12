'use strict';
const AWS = require('aws-sdk');
const FS = require('fs');
const configS3 = require('../../config/development.json').s3;
let s3bucket = new AWS.S3();
let Service = {};

Service.upload = (file,key,size, cb) => {
  FS.readFile(file, (err, body) => {
    if (err) return;
    s3bucket.putObject({
      ACL: 'public-read',
      Body: body,
      Key: key,
      Bucket: configS3.bucket,
    }, (err, data) => {
      cb(err, data);
    });
  });
};

Service.delete = (key) => {
  const promise = new Promise((resolve, reject) => {
    s3bucket.deleteObject({
      Key: key,
      Bucket: configS3.bucket
    }, (err, data) => {
      console.log(err, data);
      if (err) return reject(err);
      return resolve(data);
    });
  });
  return promise;
};

module.exports = Service;
