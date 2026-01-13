import mongoose, { Schema } from "mongoose";

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  salary: {
    type: Number,
    required: true,
    default: 0
  },
  debitCreditHistory: {
    type: Number,
    default: 0
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

export const Staff = mongoose.model('Staff', staffSchema)