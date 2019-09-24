'use strict'
require('dotenv').config()

const express = require('express'),
          hbs = require('express-handlebars'),
       routes = require('./routes'),
   bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    optimizelyExpress = require('@optimizely/express');

// setting up optimizely
const optimizely = optimizelyExpress.initialize({
  sdkKey: 'LT7jLfZuaKSp998s9SDCRK', // or process.env.SDK_KEY,
  datafileOptions: {
    autoUpdate: true,
    updateInterval: 6000
  },
  logLevel: 'info'
});

// Setting up app
const app = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(optimizely.middleware);
app.use(express.static('public'));
app.use('/', routes);

app.set('view engine', 'hbs');

app.engine( 'hbs', hbs( {
  extname: 'hbs',
  defaultView: 'default',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
}));

// Starting server
app.listen(PORT, HOST);

console.log(`Example App Running on http://${HOST}:${PORT}`);

module.exports = app;