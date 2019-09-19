var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/stripe-example");

module.exports.Order = require("./order");
module.exports.Product = require("./product");
