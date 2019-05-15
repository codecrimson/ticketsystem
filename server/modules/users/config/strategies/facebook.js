/* eslint-disable func-names */

/**
 * Module dependencies
 */
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function (config) {
  // Use facebook strategy
  passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id', 'name', 'displayName', 'emails', 'photos'],
    passReqToCallback: true,
  },
  (req, accessToken, refreshToken, profile) => {
    // Set the provider data and include tokens
    const providerData = profile._json; // eslint-disable-line no-underscore-dangle
    providerData.accessToken = accessToken;
    providerData.refreshToken = refreshToken;
  }));
};
