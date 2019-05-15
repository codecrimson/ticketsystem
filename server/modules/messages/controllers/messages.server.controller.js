/* eslint-disable no-underscore-dangle,consistent-return,func-names */
/**
 * Module dependencies
 */
const path = require('path');
const config = require(path.resolve('./server/config/config'));
const mongoose = require('mongoose');
const Message = mongoose.model('Message');
const errorHandler = require(path.resolve('./server/modules/core/controllers/errors.server.controller'));
const ticketController = require(path.resolve('./server/modules/tickets/controllers/tickets.server.controller'));

/**
 * Create an message
 */
exports.create = function (req, res) {
  const message = new Message(req.body);

  message.save((err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.json(message);
  });
};

/**
 * Show the current message
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  const message = req.message ? req.message.toJSON() : {};

  // Add a custom field to the Message, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Message model.
  message.isCurrentUserOwner = !!(req.user && message.user && message.user._id.toString() === req.user._id.toString());

  res.json(message);
};

/**
 * Update an message
 */
exports.update = function (req, res) {
  const message = req.message;

  message.message = req.body.message;

  message.save((err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.json(message);
  });
};

/**
 * Delete an message
 */
exports.delete = function (req, res) {
  const message = req.message;

  message.remove((err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.json(message);
  });
};

/**
 * List of Messages
 */
exports.list = function (req, res) {
  Message.find().sort('-created').exec((err, messages) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.json(messages);
  });
};

/**
 * List of Messages
 */
exports.sendMessage = function (req, res) {
  const message = new Message(req.body.message);
  message.ticket = req.ticket;

  message.save((err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    req.ticket.messages.push(message._id);
    req.ticket.save((saveErr) => {
      if (saveErr) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(saveErr),
        });
      }
      return res.json(req.ticket);
    });
  });
};

/**
 * List of Messages
 */
exports.listTicketMessages = function (req, res) {
  let pageSize = parseInt(req.query.maximumResults, config.defaultPageSize);
  const pageNumber = parseInt(req.query.pageNumber, 10);

  // Ensure user has rights to the requested ticket
  if (!ticketController.hasAccess(req, req.ticket)) {
    return res.status(403).json({
      message: 'User is not authorized',
    });
  }

  if (pageSize === undefined || pageSize > config.defaultPageSize || pageSize < 1 || isNaN(pageSize)) {
    pageSize = config.defaultPageSize;
  }

  const queryCriteria = { ticket: req.ticket };

  const query = Message.find(queryCriteria).sort('-createdAt')
    .limit(pageSize);

  if (pageNumber !== undefined && !isNaN(pageNumber) && pageNumber > 0) {
    const skip = (pageNumber - 1) * pageSize;
    query.skip(skip);
  }

  query.exec((err, messages) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.json(messages);
  });
};

/**
 * Message middleware
 */
exports.messageByID = (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Message is invalid',
    });
  }

  Message.findById(id).exec((err, message) => {
    if (err) {
      return next(err);
    } else if (!message) {
      return res.status(404).send({
        message: 'No message with that identifier has been found',
      });
    }
    req.message = message;
    return next();
  });
};
