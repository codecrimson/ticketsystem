

const defaultEnvConfig = require('./default');

module.exports = {
  secure: {
    ssl: false,
    privateKey: 'server/config/sslcerts/key.pem',
    certificate: 'server/config/sslcerts/cert.pem',
    chain: 'server/config/sslcerts/chain.pem',
    root: 'server/config/sslcerts/root.pem',
  },
  db: {
    uri: process.env.MONGOHQ_URL || process.env.MONGODB_URI || `mongodb://${process.env.DB_1_PORT_27017_TCP_ADDR || process.env.DOCKER_DB || 'localhost'}/somtrust-tickets-local`,
    options: {},
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false,
  },
  authdb: {
    uri: process.env.MONGOHQ_URL || process.env.MONGODB_URI || `mongodb://${process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost'}/somtrust-local`,
    options: {},

    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false,
  },
  mainAppDomain: process.env.MAIN_APP_DOMAIN || 'localhost',
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: 'dev',
    fileLogger: {
      directoryPath: process.cwd(),
      fileName: 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false,
    },
  },
  app: {
    title: `${defaultEnvConfig.app.title} - Local Environment`,
  },
  facebook: {
    clientID: process.env.FACEBOOK_ID || 'APP_ID',
    clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/facebook/callback',
  },
  google: {
    clientID: process.env.GOOGLE_ID || defaultEnvConfig.googleAuth.clientID,
    clientSecret: process.env.GOOGLE_SECRET || defaultEnvConfig.googleAuth.clientSecret,
    callbackURL: defaultEnvConfig.googleAuth.callbackURL,
    mapsKey: process.env.GOOGLE_MAP_KEY || defaultEnvConfig.googleAuth.mapsKey,
  },
  mailer: {
    from: process.env.MAILER_FROM || 'Reerticket <support@reerticket.com>',
    options: {
      host: process.env.MAILER_HOST || 'smtp.sendgrid.net',
      port: process.env.MAILER_PORT || 465,
      secure: process.env.MAILER_SECURE || true, // use SSL
      auth: {
        user: process.env.MAILER_EMAIL_ID || 'user',
        pass: process.env.MAILER_PASSWORD || 'pass',
      },
    },
  },
  livereload: true,
  seedDB: {
    seed: process.env.MONGO_SEED === 'true',
    options: {
      logResults: process.env.MONGO_SEED_LOG_RESULTS !== 'false',
    },
    // Order of collections in configuration will determine order of seeding.
    // i.e. given these settings, the User seeds will be complete before
    // Article seed is performed.
    collections: [{
      model: 'User',
      docs: [{
        data: {
          email: 'admin@localhost.com',
          firstName: 'Admin',
          lastName: 'Local',
          roles: ['admin', 'user'],
        },
      }, {
        // Set to true to overwrite this document
        // when it already exists in the collection.
        // If set to false, or missing, the seed operation
        // will skip this document to avoid overwriting it.
        overwrite: true,
        data: {
          email: 'user@localhost.com',
          firstName: 'User',
          lastName: 'Local',
          roles: ['user'],
        },
      }],
    }],
  },
};
