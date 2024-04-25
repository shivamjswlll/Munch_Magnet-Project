const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema({
    name:String,
    price: {
        type: Number,
        get: v => parseFloat(v.toFixed(2))
      },
});

module.exports.Dish = mongoose.model("Dish", dishSchema);