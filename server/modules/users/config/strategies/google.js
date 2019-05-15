/* eslint-disable func-names */

/**
 * Module dependencies
 */
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function (config) {
  // Use google strategy
  passport.use(new GoogleStrategy({
    clientID: config.google.clientID,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackURL,
    passReqToCallback: true,
  },
    (req, accessToken, refreshToken, profile) => {
      // Set the provider data and include tokens
      const providerData = profile._json; // eslint-disable-line no-underscore-dangle
      providerData.accessToken = accessToken;
      providerData.refreshToken = refreshToken;
    }));
};
