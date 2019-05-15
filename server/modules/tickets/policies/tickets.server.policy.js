/* eslint-disable func-names */
/**
 * Module dependencies
 */
let acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend()); // eslint-disable-line new-cap

/**
 * Invoke Tickets Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin', 'agent'],
    allows: [{
      resources: '/api/tickets',
      permissions: ['*'],
    }, {
      resources: '/api/tickets/me',
      permissions: ['*'],
    }, {
      resources: '/api/tickets/group/:groupId',
      permissions: ['*'],
    },{
      resources: '/api/tickets/messages/:ticketId',
      permissions: ['get','post'],
    }, {
      resources: '/api/tickets/:ticketId',
      permissions: ['*'],
    },
    {
      resources: '/api/tickets/property/:propertyId',
      permissions: ['get'],
    }],
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/tickets',
      permissions: ['post'],
    }, {
      resources: '/api/tickets/me',
      permissions: ['get'],
    }, {
      resources: '/api/tickets/group/:groupId',
      permissions: ['get'],
    },{
      resources: '/api/tickets/messages/:ticketId',
      permissions: ['get','post'],
    }, {
      resources: '/api/tickets/:ticketId',
      permissions: ['get', 'put', 'delete'],
    }],
  }]);
};

/**
 * Check If Tickets Policy Allows
 */
exports.isAllowed = function (req, res, next) { // eslint-disable-line consistent-return
  const roles = (req.user) ? req.user.roles : ['guest'];

  // If an ticket is being processed and the current user created it then allow any manipulation
  if (req.ticket && req.user && req.ticket.user && req.ticket.user.id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), (err, isAllowed) => {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    }

    if (isAllowed) {
      // Access granted! Invoke next middleware
      return next();
    }
    return res.status(403).json({
      message: 'User is not authorized',
    });
  });
};
