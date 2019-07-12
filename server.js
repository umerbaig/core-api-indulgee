'use strict';
const Glue = require('glue');
const path = require('path');
const mongoose = require('mongoose');
const NODE_ENV = process.env.NODE_ENV || 'local';
const dbConfig = require('./config/db.json')[NODE_ENV];
const manifest = require('./config/manifest');

process.argv.push('--harmony_destructuring');
if (!process.env.PRODUCTION) {
  manifest.registrations.push({
    "plugin": {
      "register": "blipp",
      "options": {}
    }
  });
}

mongoose.Promise = require('bluebird');
mongoose.connect(dbConfig.connection_string, () => {
  console.log('Connected to MongoDB');
});

Glue.compose(manifest, { relativeTo: __dirname }, (err, server) => {
  if (err) {
    console.log('server.register err:', err);
  }
  server.start(() => {
    console.log('Server is listening on ' + server.info.uri.toLowerCase());
  });
});
