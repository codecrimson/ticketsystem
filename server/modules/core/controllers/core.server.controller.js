/* eslint-disable func-names */

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
  res.sendStatus(500);
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {
  res.sendStatus(404);
};
