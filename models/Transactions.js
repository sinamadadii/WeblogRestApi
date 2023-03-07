const mongoose = require("mongoose");

const transactionsSchmea = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paired: {
    type: Boolean,
    default: false,
    required: true,
  },
});

module.exports = mongoose.model("Transactions", transactionsSchmea);
