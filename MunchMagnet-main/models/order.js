const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  dish: { type: mongoose.Schema.Types.ObjectId, ref: "Dish" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  delivered: {
    type: Boolean,
    default: false,
  },
});

module.exports.Order = mongoose.model("Order", orderSchema);
