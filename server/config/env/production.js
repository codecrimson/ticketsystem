

const defaultEnvConfig = require('./default');

const userNameValue = encodeURIComponent('userNameValue');
const password = encodeURIComponent('password');
const prodDB = {
  username: userNameValue,
  password,
  host: 'host',
  port: 'port',
  db: 'db',
};

const mongourl = `mongodb://${prodDB.username}:${prodDB.password}@${prodDB.host}:${prodDB.port}/${prodDB.db}`;

const authUserNameValue = encodeURIComponent('authUserNameValue');
const authPassword = encodeURIComponent('authPassword');
const authProdDB = {
  username: authUserNameValue,
  authPassword,
  host: 'host',
  port: 'port',
  db: 'db',
};

const authMongourl = `mongodb://${authProdDB.username}:${authProdDB.authPassword}@${authProdDB.host}:${authProdDB.port}/${authProdDB.db}`;


module.exports = {
  secure: {
    ssl: false,
    privateKey: '/opt/bitnami/apache2/conf/server.key',
    certificate: '/opt/bitnami/apache2/conf/server.crt',
    chain: '/opt/bitnami/apache2/conf/chain.pem',
    root: '/opt/bitnami/apache2/conf/root.pem',
  },
  port: process.env.PORT || 4000,
  db: {
    uri: mongourl,
    options: {

      /**
      * Uncomment to enable ssl certificate based authentication to mongodb
      * servers. Adjust the settings below for your specific certificate
      * setup.
      * for connect to a replicaset, rename server:{...} to replset:{...}

      ssl: true,
      sslValidate: false,
      checkServerIdentity: false,
      sslCA: fs.readFileSync('./config/sslcerts/ssl-ca.pem'),
      sslCert: fs.readFileSync('./config/sslcerts/ssl-cert.pem'),
      sslKey: fs.readFileSync('./config/sslcerts/ssl-key.pem'),
      sslPass: '1234'

      */
    },
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false,
  },
  authdb: {
    uri: authMongourl,
    options: {

      /**
       * Uncomment to enable ssl certificate based authentication to mongodb
       * servers. Adjust the settings below for your specific certificate
       * setup.
       * for connect to a replicaset, rename server:{...} to replset:{...}

       ssl: true,
       sslValidate: false,
       checkServerIdentity: false,
       sslCA: fs.readFileSync('./config/sslcerts/ssl-ca.pem'),
       sslCert: fs.readFileSync('./config/sslcerts/ssl-cert.pem'),
       sslKey: fs.readFileSync('./config/sslcerts/ssl-key.pem'),
       sslPass: '1234'

       */
    },
  },
  mainAppDomain: process.env.MAIN_APP_DOMAIN || 'reerticket.com',
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: process.env.LOG_FORMAT || 'combined',
    fileLogger: {
      directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
      fileName: process.env.LOG_FILE || 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false,
    },
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
};
