/* eslint-disable no-underscore-dangle,consistent-return,func-names */
/**
 * Module dependencies
 */
const path = require('path');
const mongoose = require('mongoose');
const mongooseService = require(path.resolve('server/config/lib/mongoose'));
const Ticket = mongoose.model('Ticket');
const User = mongooseService.getAuthDB().model('User');
const Message = mongoose.model('Message');
const errorHandler = require(path.resolve('./server/modules/core/controllers/errors.server.controller'));
const socketConnection = require(path.resolve('server/config/lib/socket.io'));
const _ = require('lodash');

/**
 * Create an ticket
 */

function findExistingTicketConversation(req) {
  return new Promise((resolve, reject) => {
    let ticket;
    const mainProviderSearchQuery = { from: req.body.from, to: req.body.to };
    const additionalProviderSearchQuery = { from: req.body.to, to: req.body.from };

    const searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery],
    };

    if (req.identifierAvailable) {
      const identifySearchQuery = { identifierId: req.body.identifier.identifierId,
        identifierType: req.body.identifier.identifierType };

      searchQuery.$and = [identifySearchQuery];
    }

    Ticket.findOne(searchQuery).sort('-created').exec((err, foundTicket) => {
      if (err) {
        reject(err);
      }

      if (foundTicket) {
        ticket = foundTicket;
      } else {
        const newTicket = { from: req.body.from, messages: []};
        if(req.body.group){
          newTicket.group = req.body.group
        }else{
          newTicket.to = newTicket.responder = req.body.to;
        }
        if (req.identifierAvailable) {
          newTicket.identifierType = req.body.identifier.identifierType;
          newTicket.identifierId = req.body.identifier.identifierId;
        }
        ticket = new Ticket(newTicket);
      }

      resolve(ticket);
    });
  });
}

function findAllUsersTickets(req) {
  return new Promise((resolve, reject) => {
    const mainProviderSearchQuery = { from: req.user };
    const additionalProviderSearchQuery = { to: req.user };

    const searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery],
    };

  // .populate('from', '-salt -password', User)
  //     .populate('to', '-salt -password', User)
  //     .populate('responder', '-salt -password', User)

    Ticket.find(searchQuery)
      .sort('-updatedAt')
      .exec((err, tickets) => {
      if (err) {
        reject(err);
      }
      resolve(tickets);
    });
  });
}

exports.create = function (req, res) {
  if (!req.body.to || !req.body.from || !req.body.message) {
    return res.status(400).send({
      message: 'required parameters not provided',
    });
  }

  req.identifierAvailable = req.body.identifier && req.body.identifier.identifierId && req.body.identifier.identifierType;

  findExistingTicketConversation(req)
    .then(createNewMessage)
    .then((results) => {
      results.ticket.messages.push(results.message._id);
      results.ticket.save((saveErr) => {
        if (saveErr) {
          console.log('err: ', saveErr);
          return res.status(422).send({
            message: errorHandler.getErrorMessage(saveErr),
          });
        }

        const toUser = socketConnection.findUser(results.ticket.to);

        if (toUser) {
          const eventType = req.identifierAvailable ? 'identifierMessage' : 'privateMessage';
          const emitMessage = JSON.parse(JSON.stringify(req.body.message));
          const fromUser = JSON.parse(JSON.stringify(req.user));

          // Delete unnecessary items and make some user items private
          delete emitMessage.user;
          delete fromUser.created;
          delete fromUser.provider;
          delete fromUser.roles;

          if (req.identifierAvailable) {
            emitMessage.identifierType = req.body.identifier.identifierType;
            emitMessage.identifierId = req.body.identifier.identifierId;
          }

          emitMessage.from = fromUser;


          // =======
          // the ticket object is to big to parse
          // RangeError: Maximum call stack size exceeded
          // emitMessage.ticket = JSON.parse(JSON.stringify(results.ticket));
          const leanObject = results.ticket.toObject(); // http://mongoosejs.com/docs/api.html#document_Document-toObject
          emitMessage.ticket = JSON.parse(JSON.stringify(leanObject));
          emitMessage.ticketId = emitMessage.ticket._id;
          emitMessage.event = eventType;
          //= =====================================
          // Emit the event via socketIO
          toUser.emit(eventType, emitMessage);
        }

        return res.json(results.ticket);
      });
    })
    .catch((err) => {console.log('err: ', err); res.status(422).send({
      message: errorHandler.getErrorMessage(err),
    });});

  function createNewMessage(ticket) {
    return new Promise((resolve, reject) => {
      const message = new Message(req.body.message);
      message.ticket = ticket;

      message.save((err) => {
        if (err) {
          return reject(err);
        }
        return resolve({ message, ticket });
      });
    });
  }
};

exports.hasAccess = function (req, ticket) {
  const isAdmin = _.indexOf(req.user.roles, 'admin') !== -1;
  const isCurrentUserOwner = !!(req.user && ticket.from && ticket.from.toString() === req.user._id.toString());
  const isParticipant = !!((req.user && ticket.from && ticket.from.toString() === req.user._id.toString()) ||
                            (req.user && ticket.to && ticket.to.toString() === req.user._id.toString()));

  return isParticipant || isAdmin || isCurrentUserOwner;
};

/**
 * Show the current ticket
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  const ticket = req.ticket ? req.ticket.toJSON() : {};

  // Add a custom field to the Ticket, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Ticket model.

  if (exports.hasAccess(req, ticket)) {
    res.json(ticket);
  } else {
    return res.status(404).send({
      message: 'No ticket with that identifier has been found',
    });
  }
};

/**
 * Update an ticket
 */
exports.update = function (req, res) {

  if(!(req.body.messages || req.body.ticket)){
    return res.status(40).send({
      message: 'Ticket or messages to update must be defined',
    });
  }

  const ticket = req.ticket;

  if(req.body.ticket){
    const newTicket = new Ticket(req.body.ticket);

    if(req.body.messages){
      newTicket.messages = req.body.messages;
    }

    // Delete mongoose object __v property to overcome update issue
    // https://github.com/Automattic/mongoose/issues/5973
    const newTicketObj = newTicket.toObject();
    delete newTicketObj.__v;

    Ticket.findByIdAndUpdate(ticket._id, newTicketObj, {new: true, upsert: true}, function(err, updatedTicket) {
      if(err){
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err),
        });
      }
      return res.json(updatedTicket);
    });
  }else{
    ticket.messages = req.body.messages;
    ticket.save((err) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err),
        });
      }
      return res.json(ticket);
    });
  }
};

/**
 * Delete an ticket
 */
exports.delete = function (req, res) {
  const ticket = req.ticket;

  ticket.remove((err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.json(ticket);
  });
};

/**
 * List of Tickets
 */
exports.listUserTickets = function (req, res) {
  findAllUsersTickets(req)
    .then((tickets) => res.json(tickets))
    .catch((err) => res.status(422).send({
      message: errorHandler.getErrorMessage(err),
    }));
};

exports.listGroupTickets = function (req, res) {
  const groupId = req.params.groupId;

  Ticket.find({group:groupId})
    .sort('-updatedAt')
    .exec((err, ticket) => {
      if (err) {
        return next(err);
      } else if (!ticket) {
        return res.status(404).send({
          message: 'No ticket with that identifier has been found',
        });
      }
      return res.json(ticket);
    });
};

/**
 * List of Tickets
 */
exports.list = function (req, res) {
// .populate('from', '-salt -password', User)
//     .populate('to', '-salt -password', User)
//     .populate('responder', '-salt -password', User)
  Ticket.find()
    .sort('-created')
    .exec((err, tickets) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.json(tickets);
  });
};


/**
 * Property Tickets
 */
exports.ticketByPropertyId = (req, res, next) => {
  const propertyId = req.params.propertyId;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).send({
      message: 'Ticket is invalid',
    });
  }
// .populate('from', '-salt -password', User)
//     .populate('to', '-salt -password', User)
//     .populate('responder', '-salt -password', User)
  Ticket.find({ identifierId: propertyId }).lean()
    .exec((err, ticket) => {
    if (err) {
      return next(err);
    } else if (!ticket) {
      return res.status(404).send({
        message: 'No ticket for the Property has been found',
      });
    }

    return res.json(ticket);
  });
};


/**
 * Ticket middleware
 */
exports.ticketByID = (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Ticket is invalid',
    });
  }
// .populate('from', '-salt -password', User)
//     .populate('to', '-salt -password', User)
//     .populate('responder', '-salt -password', User)
  Ticket.findById(id)
    .exec((err, ticket) => {
    if (err) {
      return next(err);
    } else if (!ticket) {
      return res.status(404).send({
        message: 'No ticket with that identifier has been found',
      });
    }
    req.ticket = ticket;
    return next();
  });
};
