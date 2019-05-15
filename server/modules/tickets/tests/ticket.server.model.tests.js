/* eslint-disable */

/**
 * Module dependencies.
 */
const should = require('should');
const mongoose = require('mongoose');
const Message = mongoose.model('Message');
const Ticket = mongoose.model('Ticket');
const ObjectID = require('mongodb').ObjectID;

/**
 * Globals
 */
let user;
let secondUser;
let ticket;
let message;

/**
 * Unit tests
 */
describe('Ticket Model Unit Tests:', function () {

  beforeEach(function (done) {
    user = ObjectID();


    message = new Message({
      message: 'I\'d like to a book a viewing',
      user,
    });

    // Create a new user
    secondUser = ObjectID();

    // Save a user to the test db and create new ticket
    message.save()
      .then(function () {
        ticket = new Ticket({
          from: user,
          to: secondUser,
          messages: [message],
        });
        done();
      })
      .catch(done);
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      ticket.save(function (err) {
        should.not.exist(err);
        return done();
      });
    });
  });

  afterEach(function (done) {
    Ticket.remove().exec()
      .then(Message.remove().exec())
      .then(done())
      .catch(done);
  });
});
