/* eslint-disable func-names */

/**
 * Module dependencies
 */
const passport = require('passport');
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const mongooseService = require(path.resolve('server/config/lib/mongoose'));
const User = mongooseService.getAuthDB().model('User');

module.exports = function () {
  // Use local strategy
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  },
  (email, password, done) => {
    User.findOne({
      email: email.toLowerCase(),
    }).exec((err, user) => {
      if (err) {
        return done(err);
      }
      if (!user || !user.authenticate(password)) {
        const messageValue = 'Invalid email or password';
        return done(null, false, {
          message: messageValue,
          localTime: `(${(new Date()).toLocaleTimeString()})`,
        });
      }

      return done(null, user);
    });
  }));
};
