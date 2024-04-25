const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "Dish" },
});

module.exports.Cart = mongoose.model("Cart", cartSchema);