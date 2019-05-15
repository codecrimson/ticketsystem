

module.exports = {
  app: {
    title: 'Reer Ticket System',
    description: 'Ticket Management system when communicating with clients',
    keywords: 'ticket, management, communicate',
    googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID',
  },
  defaultPageSize: 20,
  db: {
    promise: global.Promise,
  },
  port: process.env.PORT || 4000,
  host: process.env.HOST || 'localhost',
  // DOMAIN config should be set to the fully qualified application accessible
  // URL. For example: https://www.myapp.com (including port if required).
  domain: process.env.DOMAIN || 'https://www.reerticket.com',
  // Session Cookie settings
  sessionCookie: {
    // session expiration is set by default to 24 hours
    maxAge: 24 * (60 * 60 * 1000),
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // secure cookie should be turned to true to provide additional
    // layer of security so that the cookie is set only when working
    // in HTTPS mode.
    secure: false,
  },
  // sessionSecret should be changed for security measures and concerns
  sessionSecret: process.env.SESSION_SECRET || 'CHANGETHISSECRET--CAN BE SAME AS MAIN APP IF SHARING SESSION',
  // sessionKey is the cookie session name
  sessionKey: 'sessionId',
  sessionCollection: 'sessions',
  ticketKeySecret: process.env.TICKET_KEY_SECRET || 'CHANGE THIS TO UNIQUE SESSION FOR TICKET SYSTEM',
  // Lusca config
  csrf: {
    csrf: false,
    csp: false,
    xframe: 'SAMEORIGIN',
    p3p: 'ABCDEF',
    xssProtection: true,
  },
  illegalNames: ['reerticket', 'administrator', 'password', 'admin', 'user',
    'unknown', 'anonymous', 'null', 'undefined', 'api',
  ],
  aws: {
    s3: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET,
    },
  },
  shared: {
    owasp: {
      allowPassphrases: true,
      maxLength: 128,
      minLength: 10,
      minPhraseLength: 20,
      minOptionalTestsToPass: 4,
    },
  },
  googleAuth: {
    clientID: 'clientID.apps.googleusercontent.com',
    clientSecret: 'clientSecret',
    callbackURL: '/api/auth/google/callback',
    mapsKey: 'mapsKey',
  },
};
