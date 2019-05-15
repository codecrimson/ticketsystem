/* eslint-disable func-names,no-shadow */

/**
 * Module dependencies
 */
const mongoose = require('mongoose');
const config = require('../../../config/config');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const validator = require('validator');
const generatePassword = require('generate-password');
const owasp = require('owasp-password-strength-test');
const chalk = require('chalk');

owasp.config(config.shared.owasp);


/**
 * A Validation function for local strategy properties
 */
const validateLocalStrategyProperty = function (property) {
  return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy email
 */
const validateLocalStrategyEmail = function (email) {
  return ((this.provider !== 'local' && !this.updated) || validator.isEmail(email, { require_tld: false }));
};

/**
 * User Schema
 */
const UserSchema = new Schema({
  firstName: {
    type: String,
    trim: true,
    default: '',
    validate: [validateLocalStrategyProperty, 'Please fill in your first name'],
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
    validate: [validateLocalStrategyProperty, 'Please fill in your last name'],
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
    validate: [validateLocalStrategyEmail, 'Please fill a valid email address'],
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
});

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function (next) {
  if (this.password && this.isModified('password')) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.password = this.hashPassword(this.password);
  }

  next();
});

/**
 * Hook a pre validate method to test the local password
 */
UserSchema.pre('validate', function (next) {
  if (this.provider === 'local' && this.password && this.isModified('password')) {
    const result = owasp.test(this.password);
    if (result.errors.length) {
      const error = result.errors.join(' ');
      this.invalidate('password', error);
    }
  }

  next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function (password) {
  if (this.salt && password) {
    return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64, 'SHA1').toString('base64');
  }
  return password;
};

/**
 * Create instance method for authenticating users
 */
UserSchema.methods.authenticate = function (password) {
  return this.password === this.hashPassword(password);
};

/**
* Generates a random passphrase that passes the owasp test
* Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
* NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
*/
UserSchema.statics.generateRandomPassphrase = function () {
  return new Promise((resolve, reject) => {
    let password = '';
    const repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

    // iterate until the we have a valid passphrase
    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
    while (password.length < 20 || repeatingCharacters.test(password)) {
      // build the random password
      password = generatePassword.generate({
        length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
        numbers: true,
        symbols: false,
        uppercase: true,
        excludeSimilarCharacters: true,
      });

      // check if we need to remove any repeating characters
      password = password.replace(repeatingCharacters, '');
    }

    // Send the rejection back if the passphrase fails to pass the strength test
    if (owasp.test(password).errors.length) {
      reject(new Error('An unexpected problem occured while generating the random passphrase'));
    } else {
      // resolve with the validated passphrase
      resolve(password);
    }
  });
};

UserSchema.statics.seed = seed;

mongoose.model('User', UserSchema);

/**
 * Seeds the User collection with document (User)
 * and provided options.
 */
function seed(doc, options) {
  const User = mongoose.model('User');

  return new Promise((resolve, reject) => {
    skipDocument()
      .then(add)
      .then((response) => resolve(response))
      .catch((err) => reject(err));

    function skipDocument() {
      return new Promise((resolve, reject) => {
        User
          .findOne({
            email: doc.email,
          })
          .exec((err, existing) => {
            if (err) {
              return reject(err);
            }

            if (!existing) {
              return resolve(false);
            }

            if (existing && !options.overwrite) {
              return resolve(true);
            }

            // Remove User (overwrite)

            return existing.remove((err) => {
              if (err) {
                return reject(err);
              }

              return resolve(false);
            });
          });
      });
    }

    function add(skip) {
      return new Promise((resolve, reject) => {
        if (skip) {
          return resolve({
            message: chalk.yellow(`Database Seeding: User\t\t${doc.email} skipped`),
          });
        }

        return User.generateRandomPassphrase()
          .then((passphrase) => {
            const user = new User(doc);

            user.provider = 'local';
            user.displayName = `${user.firstName} ${user.lastName}`;
            user.password = passphrase;

            user.save((err) => {
              if (err) {
                return reject(err);
              }

              return resolve({
                message: `Database Seeding: User\t\t${user.email} added with password set to ${passphrase}`,
              });
            });
          })
          .catch((err) => reject(err));
      });
    }
  });
}
