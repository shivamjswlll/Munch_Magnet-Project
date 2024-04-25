const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
    name:String,
    address:String,
    sub_title:String,
    rating:Number,
    img_url:String,
    menu:[{ type: mongoose.Schema.Types.ObjectId, ref: "Dish" }],
});

module.exports.Restaurant = mongoose.model("Restaurant", restaurantSchema);