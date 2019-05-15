/* eslint-disable no-shadow,consistent-return */
/**
 * Module dependencies
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Ticket Schema
 */
const TicketSchema = new Schema({
  ticketNumber: {
    type: Number,
    unique: true,
    default: 0,
  },
  from: {
    type: Schema.ObjectId,
  },
  to: {
    type: Schema.ObjectId,
  },
  responder: {
    type: Schema.ObjectId,
  },
  group: {
    type: Schema.ObjectId,
  },
  title: {
    type: String,
    default: 'Inquiry',
    trim: true,
  },
  messages: [
    {
      type: Schema.ObjectId,
      ref: 'Message',
      required: 'Message required',
    },
  ],
  identifierId: {
    type: Schema.ObjectId,
  },
  identifierType: {
    type: String,
    trim: true,
  },
  attachments: {
    type: [String],
  },
  notifyEmailList: {
    type: [String],
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Low',
  },
  status: {
    type: String,
    enum: ['Open', 'Pending', 'Resolved', 'Closed: Resolved'],
    default: 'Open',
  },
  subStatus: {
    type: String,
  },
  isEscalted: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true, usePushEach: true });

var CounterSchema = new mongoose.Schema({
  _id: {type: String, required: true},
  seq: { type: Number, default: 0 }
});
var counter = mongoose.model('counter', CounterSchema);

TicketSchema.pre('save', function(next) {
  let doc = this;
  if(!doc.ticketNumber){
    counter.findByIdAndUpdate({_id: 'entityId'}, {$inc: { seq: 1} }, {new: true, upsert: true}).then(function(count) {
      doc.ticketNumber = count.seq;
      next();
    }).catch(function(error) {
      throw error;
    });
  }else{
    next();
  }
});

mongoose.model('Ticket', TicketSchema);

