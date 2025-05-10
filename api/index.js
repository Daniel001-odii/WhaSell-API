require('dotenv').config();
const express = require("express");
const app = express();
const http = require('http');
const cors = require("cors");
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


// use cookie-parser
app.use(cookieParser());

// Configure CORS
const corsOptions = {
  origin: [
    'http://localhost:8080', 
    'http://localhost:3000', 
    'https://whatsell-nuxt.vercel.app',
    'https://wha-sell.vercel.app',
    'https://whatsell-waitlist.vercel.app',
    'https://whatsell.com.ng', 
    'https://www.whatsell.store', 
    'https://whatsell.store', 
    'https://whasell.onrender.com'
    ],// Specify your frontend URL
  credentials: true // Enable credentials
};

// Use the cors middleware with options to specify the allowed origin [----DO NOT REMOVE FRPM HERE----]
app.use(cors(corsOptions));
// Middleware
app.use(bodyParser.json());

// just for cookies...
// app.use(function(req, res, next) {  
//   res.header('Access-Control-Allow-Origin', req.headers.origin);
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });  


// CONFIGURE HANDLEBARS FOR DYNAMIC EMAIL TEMPLATING..
const exphbs = require('express-handlebars');


// CONNECT TO DB HERE....
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true } )
.then(() => console.log('Whasell database connected successfully'))
.catch((err) => { console.error(err); });

// Initialize cron jobs
const { scheduleDeliveryCheck } = require('./cron/checkProductDelivery');
scheduleDeliveryCheck();

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({
  extended: true
}));


// IMPORT ALL ROUTE FILES HERE....
const authRoutes = require("./routes/authRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const productRoutes = require("./routes/productRoutes");
const shopRoutes = require("./routes/shopRoutes");
const userRoutes = require("./routes/userRoutes");
const waitlistRoutes = require("./routes/waitlistRoutes");
const walletRoutes = require('./routes/walletRoutes');



// Serve static files from the 'public' directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// USE ROUTES HERE....
app.use('/api', authRoutes);
app.use('/api', userRoutes);
// app.use('/api', invoiceRoutes);
// app.use('/api', notificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api', categoriesRoutes);

app.use('/uploads',  express.static('uploads'));
app.use('/product-images',  express.static('product-images'));
// app.use('/api', userRoutes);
app.use('/api', waitlistRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/', function(req, res){
  return res.send("whatsell API is live...")
})


// SET VIEW ENGINE FOR EMAIL TEMPLATES....
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'templates', 'emails'));


// trying server side rendering...
const Shop = require('./models/shopModel');
const Product = require('./models/productModel');
const { formatDistanceToNow } = require('date-fns');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Define the isAllowed function
function isAllowed(user, shop) {
  if (!user || !shop || !shop.owner) {
      return false;
  }
  return user._id === shop.owner._id;
}


function checkLikes(productId) {
  // Implement your logic to check if the product is liked by the user
  return false; // Placeholder
}

app.get('/product/:id', async (req, res) => {
  try {
      const product = await Product.findById(req.params.id).exec();
      if (!product) {
          return res.status(404).render('product', {
              error_getting_product: true,
              loading: false,
          });
      }

      const shop = await Shop.findById(product.shop).exec();
      const user = req.user; // Assuming you have user authentication

      res.render('product', {
          product: product,
          shop: {
              ...shop.toObject(),
              createdAt: new Date(shop.createdAt), // Ensure createdAt is a Date object
          },
          user: user,
          shop_location: shop.owner.location,
          error_getting_product: false,
          loading: false,
          main_image: product.images[0],
          wa_message_text: `Hello, I am interested in this product: ${req.protocol}://${req.get('host')}${req.originalUrl}`,
          formatDistanceToNow: formatDistanceToNow, // Pass the function to the template
          isAllowed: isAllowed, // Pass the isAllowed function to the template
          checkLikes: checkLikes, // Pass the checkLikes function to the template
      });
  } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).render('product', {
          error_getting_product: true,
          loading: false,
      });
  }
});

//setup server to listen on port declared on env
app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
})


module.exports = app;


