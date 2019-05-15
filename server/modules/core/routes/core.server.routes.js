/* eslint-disable func-names */

// Root routing
const core = require('../controllers/core.server.controller');

module.exports = function (app) {
  // Define error pages
  app.route('/server-error').get(core.renderServerError);
};
