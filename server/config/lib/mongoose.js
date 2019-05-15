/* eslint-disable */

/**
 * Module dependencies.
 */
const _ = require('lodash');
const config = require('../config');
const chalk = require('chalk');
const path = require('path');
const mongoose = require('mongoose');

module.exports.authDB = undefined;

// Load the mongoose models
module.exports.loadModels = function (callback) {
  // Globbing model files
  config.files.server.models.forEach((modelPath) => {
    require(path.resolve(modelPath));
  });

  if (callback) callback();
};

// Initialize Mongoose
module.exports.connect = function (callback) {
  mongoose.Promise = config.db.promise;

  const options = _.merge(config.db.options || {}, { useMongoClient: true });
  mongoose
    .connect(config.db.uri, options)
    .then((connection) => {
      // Enabling mongoose debug mode if required
      mongoose.set('debug', config.db.debug);

      // Call callback FN
      if (callback) callback(connection.db);
    })
    .catch((err) => {
      console.error(chalk.red('Could not connect to MongoDB!'));
      console.log(err);
    });
};

module.exports.disconnect = function (cb) {
  mongoose.connection.db
    .close((err) => {
      console.info(chalk.yellow('Disconnected from MongoDB.'));
      return cb(err);
    });
};

// Initialize Mongoose
module.exports.connectToAuth = function () {
  const mongooseOptions = _.merge(config.authdb.options || {}, { useMongoClient: true });
  const db = mongoose.createConnection(config.authdb.uri, mongooseOptions);

  db.model('User', new mongoose.Schema({
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    displayName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      index: {
        unique: true,
        sparse: true, // For this to work on a previously indexed field, the index must be dropped & the application restarted.
      },
      lowercase: true,
      trim: true,
      required: 'Please fill in a email',
    },
    password: {
      type: String,
      default: '',
    },
    salt: {
      type: String,
    },
    profileImageURL: {
      type: String,
      default: 'app/images/profile/default.png',
    },
    provider: {
      type: String,
      required: 'Provider is required',
    },
    providerData: {},
    additionalProvidersData: {},
    roles: {
      type: [{
        type: String,
        enum: ['user', 'admin', 'agent'],
      }],
      default: ['user'],
      required: 'Please provide at least one role',
    },
    updated: {
      type: Date,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    /* For reset password */
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  }));

  this.authDB = db;
};

module.exports.getAuthDB = function () {
  if(!this.authDB){
    this.connectToAuth();
  }

  return this.authDB;
};
