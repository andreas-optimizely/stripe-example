'use strict'
require('dotenv').config()

const express = require('express'),
   bodyParser = require('body-parser'),
           db = require("../models"),
         uuid = require('uuid/v4'),
       stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Homepage Route
router.get('/', (req, res, next) => {
  let renderObject = {
      layout: 'default',
      template: 'home-template',
      productError: false,
      products: []
    }

  //getting products from DB to display on homepage
 db.Product.find({}).then(products => {
    renderObject.products = products;
    res.render('home', renderObject);
  }).catch(err => {
    renderObject.productError = true
    res.render('home', renderObject);
  })
});

// TODO add individual pdp
router.get('/products/:id', (req,res,next) => {

})

// Endpoint to create an order
router.post('/orders', (req, res, next ) => {
  //Order details I want to save
  let orderDetails = {
    productIds: [req.body.productId],
    status: 'new',
    orderTotal: req.body.productPrice
  }
  
  // Create a new order in DB
  let orderData = new db.Order(orderDetails);
  orderData.save().then((order) => {
    // Set cookie to remember the order
    res.cookie('order_id', order._id);
    res.redirect('/cart');
  }).catch(err => {
    res.status(400).send("unable to save to database");
 });
})

// Cart endpoint
router.get('/cart', (req, res, next) => {
  let orderId = req.cookies['order_id'];
  let orderTotal;

  // Look up order in db
  db.Order.find({_id: orderId}).then( order => {
    orderTotal = order[0].orderTotal;
    db.Product.find({
      _id: { $in: order[0].productIds}
    }).then(products => {
      res.render('cart', {
        layout: 'default',
        template: 'cart-template',
        products: products,
        orderTotal: orderTotal
      });

    }).catch( err => {
      console.log(err);
      res.redirect('/');
    })
  }).catch( err => {
    console.log(err);
    res.redirect('/');
  })
});

router.get('/fetch-session', (req, res,next) =>{
});

// Endpoint to handle ordering 
router.post('/checkout', (req, res, next) => {
  // Create charge within stripe
  const token = req.body.stripeToken;
  const orderId = req.body.orderId;
  // TODO check for feature flag, if so, skip stripe charge

  // Create charge via stripe sdk using token retrieved
  stripe.charges.create({
    amount: req.body.orderTotal,
    currency: "usd",
    source: 'tok_visa', // testing token, update with token when using in prod
    description: `Charge for ${req.body.email}`
  }, (err, charge) => {
    // Checking to see if there was an error from stripe
    if(err){
      console.log('ERROR ', err)
      return res.send(500)
    }
    // if no error, then lets go ahead an update the order with the rest of the data entered
    let updateOrderData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipcode: req.body.zip,
      chargeId: charge.id, // from stripe charge
      receiptUrl: charge.receipt_url, // from stripe charge
      status: 'paid' // update the state of the order
    }
    // Update the order state
    db.Order.findOneAndUpdate({_id:orderId},updateOrderData,{upsert:true},(err, updatedDoc)=>{
      if (err) {
        console.log('ERROR saving object ', err);
       return res.send(500, { error: err })
      }
      res.redirect('/thank-you')  
    })
    
  });

});

router.get('/checkout', (req, res, next) => {
  // TODO - generate another userId and store that somewhere
  let userId = '1234151512';
  let orderId = req.cookies['order_id'];
  let orderTotal;
  
  // get state of Optimizely feature flag
  let redirectEnabled = req.optimizely.client.isFeatureEnabled('stripeCheckoutRedirect', userId);

  // Look up the order 
  db.Order.find({_id: orderId}).then( order => {
    orderTotal = order[0].orderTotal;

    // setting a default object that we can render
    let renderObject = {
            layout: 'default',
            template: 'checkout-template',
            orderTotal: orderTotal,
            stripeKey: process.env.STRIPE_TOKEN,
            stripeSession: "",
            redirectEnabled:redirectEnabled,
            orderId:orderId
          }
    
    // Check to see if redirect is enabled
    // If redirect is enabled, then we need to get a stripe session key
    // If it's not enabled, we can just just go ahead render the checkout
    if(redirectEnabled){
      db.Product.find({
        _id: { $in: order[0].productIds}
      }).then(products => {
          stripe.checkout.sessions.create({
            payment_method_types: ['card'],
              line_items: [{
                name: products[0].name,
                images: [products[0].image],
                amount: orderTotal*100,
                currency: 'usd',
                quantity: 1,
            }],
            success_url: 'http://localhost:8080/thank-you?redirect=true',
            cancel_url: 'https://example.com/cancel',
          }, 
          (err, session) => {
            if(err){
              console.log(err);
              console.log('THERE WAS AN ERROR');
              return
            }
            // Pass stripe session token to the client
            renderObject.stripeSession = session.id;
            res.render('checkout', renderObject)
          })

      }).catch(err => {
        console.log(err);
      })
    }
    // If the redirect feature isnt enabled just render the checkout
    res.render('checkout', renderObject)
  }).catch( err => {
    // if there are any errors lets just redirect to cart
    console.log(err);
    res.redirect('/cart');
  })

});

// Route for when an order is complete
router.get('/thank-you', (req, res) => {
  let orderId = req.cookies['order_id'];
  // Check to see if there is an actual order if not, redirect to home
  if(!orderId) {
    res.redirect('/')
  }

  // Possible TODO - check feature flag state to see which checkout method user used
  // IF user used stripe redirect, then we need to update the order info

  // if order exists look up order and render on page
  db.Order.find({_id:orderId}).then( orders => {
    let order = orders[0]
    res.clearCookie('order_id')
    res.render('thanks', {
      layout: 'default',
      template: 'thanks-template',
      firstName: order.firstName,
      _id: order._id,
      orderTotal: order.orderTotal,
      address: order.address,
      city: order.city,
      state: order.state,
      zipcode: order.zipcode,
      email: order.email,
      receiptLink: order.receiptUrl,
      chargeId: order.chargeId
    });  
  })
})

router.post('/webhook', bodyParser.text({type: '*/*'}), (req, res) =>{
  console.log('INCOMING WEBHOOK');
  const sig = req.headers['stripe-signature'];

  let event;
  console.log(sig);

  console.log(req.body);
  console.log('TYPE OF BODY ', typeof req.body);
  console.log(endpointSecret);

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(event)
    res.json({received: true});
    res.status(200).send('All done');
  }  

})
module.exports = router