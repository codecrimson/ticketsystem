/* eslint-disable */

/**
 * Module dependencies.
 */
let config = require('../config'),
  cors = require('cors'),
  express = require('express'),
  morgan = require('morgan'),
  logger = require('./logger'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  MongoStore = require('connect-mongo')(session),
  compress = require('compression'),
  methodOverride = require('method-override'),
  cookieParser = require('cookie-parser'),
  helmet = require('helmet'),
  flash = require('connect-flash'),
  hbs = require('express-hbs'),
  path = require('path'),
  _ = require('lodash'),
  lusca = require('lusca'),
  mongooseService = require(path.resolve('server/config/lib/mongoose'));


module.exports.mongoStore = undefined;
/**
 * Initialize local variables
 */
module.exports.initLocalVariables = function (app) {
  // Setting application local variables
  app.locals.title = config.app.title;
  app.locals.description = config.app.description;
  if (config.secure && config.secure.ssl === true) {
    app.locals.secure = config.secure.ssl;
  }
  app.locals.keywords = config.app.keywords;
  app.locals.googleAnalyticsTrackingID = config.app.googleAnalyticsTrackingID;
  app.locals.facebookAppId = config.facebook.clientID;
  app.locals.livereload = config.livereload;
  app.locals.logo = config.logo;
  app.locals.env = process.env.NODE_ENV;
  app.locals.domain = config.domain;

  // Passing the request url to environment locals
  app.use((req, res, next) => {
    res.locals.host = `${req.protocol}://${req.hostname}`;
    res.locals.url = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
    next();
  });
};

/**
 * Initialize application middleware
 */
module.exports.initMiddleware = function (app) {
  // Should be placed before express.static
  app.use(compress({
    filter(req, res) {
      return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
    },
    level: 9,
  }));

  // Enable logger (morgan) if enabled in the configuration file
  if (_.has(config, 'log.format')) {
    app.use(morgan(logger.getLogFormat(), logger.getMorganOptions()));
  }

  // Environment dependent middleware
  if (process.env.NODE_ENV === 'development') {
    // Disable views cache
    app.set('view cache', false);
  } else if (process.env.NODE_ENV === 'production') {
    app.locals.cache = 'memory';
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.urlencoded({
    extended: true,
  }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  // Add the cookie parser and flash middleware
  app.use(cookieParser());
  app.use(flash());
};

/**
 * Configure Express session
 */
module.exports.initSession = function (app, db) {
  // Express MongoDB session storage
  app.use(session({
    saveUninitialized: true,
    resave: true,
    secret: config.sessionSecret,
    cookie: {
      path: '/',
      domain: config.mainAppDomain,
      maxAge: config.sessionCookie.maxAge,
      httpOnly: config.sessionCookie.httpOnly,
      secure: config.sessionCookie.secure && config.secure.ssl,
    },
    key: config.sessionKey,
    store: this.getMongoStore(),
  }));

  // Add Lusca CSRF Middleware
  app.use(lusca(config.csrf));
};

/**
 * Invoke modules server configuration
 */
module.exports.initModulesConfiguration = function (app) {
  config.files.server.configs.forEach((configPath) => {
    require(path.resolve(configPath))(app);
  });
};

/**
 * Configure Helmet headers configuration for security
 */
module.exports.initHelmetHeaders = function (app) {
  // six months expiration period specified in seconds
  const SIX_MONTHS = 15778476;

  app.use(helmet.frameguard());
  app.use(helmet.xssFilter());
  app.use(helmet.noSniff());
  app.use(helmet.ieNoOpen());
  app.use(helmet.hsts({
    maxAge: SIX_MONTHS,
    includeSubdomains: true,
    force: true,
  }));
  app.disable('x-powered-by');
};

/**
 * Configure the modules ACL policies
 */
module.exports.initModulesServerPolicies = function (app) {
  // Globbing policy files
  config.files.server.policies.forEach((policyPath) => {
    require(path.resolve(policyPath)).invokeRolesPolicies();
  });
};

/**
 * Configure the modules server routes
 */
module.exports.initModulesServerRoutes = function (app) {
  // Globbing routing files
  config.files.server.routes.forEach((routePath) => {
    require(path.resolve(routePath))(app);
  });
};

/**
 * Configure error handling
 */
module.exports.initErrorRoutes = function (app) {
  app.use((err, req, res, next) => {
    // If the error object doesn't exists
    if (!err) {
      return next();
    }

    // Log it
    console.error(err.stack);

    // Redirect to error page
    return res.redirect('/server-error');
  });
};

/**
 * Configure Socket.io
 */
module.exports.configureSocketIO = function (app) {
  // Load the Socket.io configuration
  const server = require('./socket.io')(app);

  // Return server object
  return server;
};

/**
 * Initialize the Express application
 */
module.exports.init = function (db) {
  // Initialize express app
  let app = express();

  app.use(express.static('server/static'))

  // Initialize local variables
  this.initLocalVariables(app);

  // Initialize Express middleware
  this.initMiddleware(app);

  // Initialize Helmet security headers
  this.initHelmetHeaders(app);

  // Initialize Express session
  this.initSession(app, db);

  // Initialize Modules configuration
  this.initModulesConfiguration(app);

  // Initialize modules server authorization policies
  this.initModulesServerPolicies(app);

  this.initModulesServerRoutes(app);

  this.initErrorRoutes(app);

  // Configure Socket.io
  app = this.configureSocketIO(app);

  return app;
};

module.exports.getMongoStore = function () {
  if(!this.mongoStore){
    this.mongoStore = new MongoStore({
      mongooseConnection: mongooseService.getAuthDB(),
      collection: config.sessionCollection,
    });
  }

  return this.mongoStore;
};
