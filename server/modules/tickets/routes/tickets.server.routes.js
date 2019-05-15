/**
 * Module dependencies
 */
const path = require('path');
const ticketsPolicy = require('../policies/tickets.server.policy');
const tickets = require('../controllers/tickets.server.controller');
const messages = require(path.resolve('./server/modules/messages/controllers/messages.server.controller'));

// eslint-disable-next-line func-names
module.exports = function (app) {
  // Tickets collection routes
  app.route('/api/tickets').all(ticketsPolicy.isAllowed)
    .get(tickets.list)
    .post(tickets.create);

  app.route('/api/tickets/me').all(ticketsPolicy.isAllowed)
    .get(tickets.listUserTickets);

  app.route('/api/tickets/group/:groupId').all(ticketsPolicy.isAllowed)
    .get(tickets.listGroupTickets);

  app.route('/api/tickets/messages/:ticketId').all(ticketsPolicy.isAllowed)
    .get(messages.listTicketMessages)
    .post(messages.sendMessage);

  // Single ticket routes
  app.route('/api/tickets/:ticketId').all(ticketsPolicy.isAllowed)
    .get(tickets.read)
    .put(tickets.update)
    .delete(tickets.delete);

    // Single ticket routes
    app.route('/api/tickets/property/:propertyId').all(ticketsPolicy.isAllowed)
    .get(tickets.ticketByPropertyId);

  // Finish by binding the ticket middleware
  app.param('ticketId', tickets.ticketByID);
};
