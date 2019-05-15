/* eslint-disable func-names */
/**
 * Module dependencies
 */
const passport = require('passport');
const path = require('path');
const config = require(path.resolve('./server/config/config'));
const mongooseService = require(path.resolve('server/config/lib/mongoose'));
const User = mongooseService.getAuthDB().model('User');

/**
 * Module init function
 */
module.exports = function (app) {
  // Serialize sessions
  passport.serializeUser((user, done) => done(null, user.id));

  // Deserialize sessions
  passport.deserializeUser((id, done) => {
    User.findOne({
      _id: id,
    }, '-salt -password', (err, user) => done(err, user));
  });

  // Initialize strategies
  config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach((strategy) => {
    require(path.resolve(strategy))(config); // eslint-disable-line global-require
  });

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
