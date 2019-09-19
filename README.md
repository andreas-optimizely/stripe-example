# Hawaiian Shirt Emporium
---
![Homepage screenshot](/public/images/homepage-screenshot.png "Homepage Screenshot")

The Hawaiian Shirt Emporium, is your one stop shop for stunning timeless hawaiian shirts.

This application is a simple ecommerce site using Node, Express, using HandlebarsJS for templating and Mongodb for the database. Additionally, the Hawaiian Shirt Emporium is implemented to take advantage of  [Stripe Elements](https://stripe.com/payments/elements) to capture credit card data and [Optimizely Full Stack](https://docs.developers.optimizely.com/full-stack) for feature flagging and AB testing capabilities.

The appication has four key use facing views:
- **Homepage** || Displays products and allows a user to add a product to their cart
- **Cart Page** || Displays the users order on the cart page for review before proceeding to checkout
- **Checkout page** || Single page to enter your shipping information and credit card information via Stripe Elements
- **Thank you page** || Displayed after a success order with details about the order

## How I approached the problem

In this case I knew I needed to have a database to be able to manage a product catalog and order state. I then began reading the Stripe documentation, and quickly implemented [Stripe Checkout](https://stripe.com/docs/payments/checkout) in my checkout to redirect users to Stripe to process the credit card form. In doing so, I needed to create a session token server side via the [Stripe Node SDK](https://github.com/stripe/stripe-node) `stripe.checkout.sessions.create` ([/routes/index.js 165](https://github.com/andreas-optimizely/stripe-example/blob/master/routes/index.js#L165)). While this was incredibly easy to setup, I found it was getting complex to manage order state between Stripe Checkout and my appication. I then pivoted to use Stripe Elements instead to capture credit card form data on own checkout page, and use the `stripe.charges.create`([/routes/index.js 97](https://github.com/andreas-optimizely/stripe-example/blob/master/routes/index.js#L97)) method to process the charge using the token generated by Stripe. 

While I pivoted my work, I didn't want to scrap my old work using Stripe Checkout, so I implemented an Optimizely feature flag ([/routes/index.js 141](https://github.com/andreas-optimizely/stripe-example/blob/master/routes/index.js#L141)). This feature flag checks to see if Checkouts is enabled, sends it to my handlebars template, and if so, generates a session ID and passes that to the client. If Checkout is _not_ enabled, then I render the checkout with Stripe Elements form ([views/checkout.hbs 53](https://github.com/andreas-optimizely/stripe-example/blob/master/views/checkout.hbs#L53) & [views/partials/cardForm.hbs](https://github.com/andreas-optimizely/stripe-example/blob/master/views/partials/cardForm.hbs). This feature flag allows me to keep both implementations temporarily, and gives me the ability to test the different Stripe implementations (Checkout vs Elements).

## Technologies Used and Why I Used them

I chose Node simply because I am most comfortable with Javascript. However, I could have easily done this in Ruby using the Rails framework, although I somtimes feel Rails abstracts too much, and makes things too easy.

For frameworks, I used Express as middeware to handle my endpoints, Handlebars because it's a simple templating framework to use, and Mongodb as my database to store product and order data.

## How I would extend this to build a more robust application

There is a _a lot_ of refactoring I need to do here to better ahere to DRY pricinples and handling asynchronous ops (there's a lot of async functions being called). Abstracting functions would allow for more readable code, especially when it comes to handling promises/callbacks. As well as provide better maintainability when it comes to error handling, which can be vastly improved in the future. For example, I would create helper functions for many of the database functions necessary to abstract that logic out of my controller (`/routes`). Further there are a few places that my queries can be improved for performance reasons.

 In the future, I would rewrite the frontend using React to provide a cleaner and fase user experience client side, while allowing me to build a more robust api by separating more of the concerns.

Additional features I'd like to add:
1. Individual product details pages
2. Updated cart functionality, such as adding multiple items and multiple of the same items (this would require a number of schema updates)
3. Fully implement Stripe Checkout, and A/B test this against elements - this would require refactoring the checkout page to capture shipping/user data
4. Add more products and enhance the UI with better layouts, header, etc




