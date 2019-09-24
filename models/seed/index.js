'use strict'
const seeder = require('mongoose-seed');

console.log('Running Seed script');

// Connect to MongoDB via Mongoose
seeder.connect('mongodb://localhost:27017/stripe-example', () => {
 
  // Load Mongoose models
  seeder.loadModels([
    './models/product.js'
  ]);
 
  // Clear specified collections
  seeder.clearModels(['Product'], () => {
 
    // Callback to populate DB once collections have been cleared
    seeder.populateModels(data, () => {
      console.log('Done populating data');
      seeder.disconnect();
    });
 
  });
});
 
// Data array containing seed data - documents organized by Model
var data = [
    {
        'model': 'Product',
        'documents': [
            {
                'name': 'Orange you glad',
                'price': 75,
                'image': '/images/blue-orange.jpg'
            },
            {
                'name': 'Banana Rama',
                'price': 95,
                'image': '/images/red-bananna.jpg'
            },
            {
                'name': 'Aloha Blue',
                'price': 125,
                'image': '/images/light-blue.jpeg'
            }
        ]
    }
];

