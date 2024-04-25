const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = new mongoose.Schema({
    email:String,
    cart:[{ type: mongoose.Schema.Types.ObjectId, ref: "Cart" }],
    order:[{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
});

userSchema.plugin(passportLocalMongoose);

module.exports.User = mongoose.model("User", userSchema);