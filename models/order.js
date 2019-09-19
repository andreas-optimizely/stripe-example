const mongoose = require("mongoose");

// Simply Schema 
let orderSchema = new mongoose.Schema({
  productIds: {
  	type: Array,
  	},
  status: {
  	type: String,
  },
  productName:{
    type: String
  },
  orderTotal: {
    type: String
  },
  productPrice: {
    type: Number
  },
  firstName:{
    type: String
  },
  lastName: {
    type: String
  },
  email: {
    type: String
  },
  address:{
    type: String
  },
  city:{
    type: String
  },
  zipcode:{
    type: Number
  },
  chargeId:{
    type: String
  },
  receiptUrl:{
    type: String
  }
});

let Order = mongoose.model("Order", orderSchema);

module.exports = Order;
