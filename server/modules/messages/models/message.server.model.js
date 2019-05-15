/* eslint-disable no-shadow,consistent-return */
/**
 * Module dependencies
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Message Schema
 */
const MessageSchema = new Schema({
  message: {
    type: String,
    default: '',
    trim: true,
    required: 'Message cannot be blank',
  },
  user: {
    type: Schema.ObjectId,
  },
  ticket: {
    type: Schema.ObjectId,
    ref: 'Ticket',
  },
}, { timestamps: true, usePushEach: true });

mongoose.model('Message', MessageSchema);

