/* eslint-disable no-param-reassign */

const path = require('path');
const socketConnection = require(path.resolve('server/config/lib/socket.io'));
// Create the chat configuration
module.exports = function (io, socket) {
  // Emit the status event when a socket client is disconnected
  socket.on('disconnect', () => {
    socketConnection.removeUser(socket);
  });
};
