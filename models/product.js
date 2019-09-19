const mongoose = require("mongoose");

// Simply Schema 
let productSchema = new mongoose.Schema({
  image: {
  	type: String,
  },
  name:{
    type: String
  },
  price: {
    type: Number
  }
});

let Product = mongoose.model("Product", productSchema);

module.exports = Product;
