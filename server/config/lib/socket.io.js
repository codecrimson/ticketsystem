/* eslint-disable no-param-reassign,global-require */


// Load the module dependencies
const config = require('../config');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const socketio = require('socket.io');
const expressService = require('./express');

module.exports.connectedUsers = [];
// Define the Socket.io configuration method
module.exports = function (app) {
  let server;

  if (config.secure && config.secure.ssl === true) {
    // Load SSL key and certificate
    const privateKey = fs.readFileSync(path.resolve(config.secure.privateKey), 'utf8');
    const certificate = fs.readFileSync(path.resolve(config.secure.certificate), 'utf8');
    let caBundle;

    try {
      caBundle = [fs.readFileSync(path.resolve(config.secure.root), 'utf8'),
        fs.readFileSync(path.resolve(config.secure.chain), 'utf8'),
      ];
    } catch (err) {
      console.log('Warning: couldn\'t find or read caBundle file');
    }

    const options = {
      key: privateKey,
      cert: certificate,
      ca: caBundle,
      //  requestCert : true,
      //  rejectUnauthorized : true,
      secureProtocol: 'TLSv1_method',
      ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'DHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-SHA256',
        'DHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384',
        'DHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES256-SHA256',
        'DHE-RSA-AES256-SHA256',
        'HIGH',
        '!aNULL',
        '!eNULL',
        '!EXPORT',
        '!DES',
        '!RC4',
        '!MD5',
        '!PSK',
        '!SRP',
        '!CAMELLIA',
      ].join(':'),
      honorCipherOrder: true,
    };
    // Create new HTTPS Server
    server = https.createServer(options, app);
  } else {
    // Create a new HTTP server
    server = http.createServer(app);
  }

  // Create a new Socket.io server
  const io = socketio.listen(server);

  // Create a MongoDB storage object
  const mongoStore = expressService.getMongoStore();

  // Intercept Socket.io's handshake request
  io.use((socket, next) => {
    // Use the 'cookie-parser' module to parse the request cookies
    cookieParser(config.sessionSecret)(socket.request, {}, () => {
      // Get the session id from the request cookies
      const sessionId = socket.request.signedCookies ? socket.request.signedCookies[config.sessionKey] : undefined;

      if (!sessionId) return next(new Error('sessionId was not found in socket.request'), false);

      // Use the mongoStorage instance to get the Express session information

      return mongoStore.get(sessionId, (err, session) => { // eslint-disable-line no-shadow
        if (err) return next(err, false);
        if (!session) return next(new Error(`session was not found for ${sessionId}`), false);

        // Set the Socket.io session information
        socket.request.session = session;

        // Use Passport to populate the user details
        return passport.initialize()(socket.request, {}, () => {
          passport.session()(socket.request, {}, () => {
            if (socket.request.session.passport.user) {
              next(null, true);
            } else {
              next(new Error('User is not authenticated'), false);
            }
          });
        });
      });
    });
  });

  // Add an event listener to the 'connection' event
  io.on('connection', (socket) => {
    module.exports.pushUser(socket);
    config.files.server.sockets.forEach((socketConfiguration) => {
      require(path.resolve(socketConfiguration))(io, socket);
    });
  });

  return server;
};

module.exports.getConnectedUsers = function () {
  return this.connectedUsers;
};

module.exports.pushUser = function (socket) {
  if (!this.connectedUsers) {
    this.connectedUsers = [];
  }
  this.connectedUsers.push(socket);
};

module.exports.removeUser = function (socket) {
  if (this.connectedUsers) {
    const index = this.connectedUsers.indexOf(socket);
    this.connectedUsers.splice(index, 1);
  }
};

module.exports.findUser = function (user) {
  if (this.connectedUsers) {
    for (let i = 0; i < this.connectedUsers.length; i += 1) {
      const checkUser = this.connectedUsers[i].request.session.passport.user;
      if (user.toString() === checkUser.toString()) {
        return this.connectedUsers[i];
      }
    }
  }
  return null;
};

