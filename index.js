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
    'https://wha-sell.vercel.app',
    'https://whatsell-waitlist.vercel.app',
    'https://whatsell.com.ng', 
    'https://www.whatsell.store', 
    'https://whatsell.store', 
    'https://whasell.onrender.com'],// Specify your frontend URL
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

app.get('/', function(req, res){
  return res.send("whatsell API is live...")
})


// SET VIEW ENGINE FOR EMAIL TEMPLATES....
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'templates', 'emails'));


//setup server to listen on port declared on env
app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
})



