/* eslint-disable */

/**
 * Module dependencies.
 */
const should = require('should');
const mongoose = require('mongoose');
const Message = mongoose.model('Message');
const ObjectID = require('mongodb').ObjectID;

/**
 * Globals
 */
var user,
  message;

/**
 * Unit tests
 */
describe('Message Model Unit Tests:', function () {

  beforeEach(function (done) {
    user = ObjectID();
    message = new Message({
      message: 'Message message',
      user: user
    });
    done();
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      message.save(function (err) {
        should.not.exist(err);
        return done();
      });
    });

    it('should be able to show an error when try to save without message', function (done) {
      message.message = '';

      message.save(function (err) {
        should.exist(err);
        return done();
      });
    });
  });

  afterEach(function (done) {
    Message.remove().exec()
      .then(done())
      .catch(done);
  });
});
