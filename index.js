require('dotenv').config();
const express = require("express");
const app = express();
const http = require('http');
const cors = require("cors");
const path = require('path');
const mongoose = require('mongoose');






// Use the cors middleware with options to specify the allowed origin [----DO NOT REMOVE FRPM HERE----]
app.use(cors());


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
const invoiceRoutes = require("./routes/invoiceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const productRoutes = require("./routes/productRoutes");
const shopRoutes = require("./routes/shopRoutes");
const userRoutes = require("./routes/userRoutes");


// USE ROUTES HERE....
app.use('/api', authRoutes);
// app.use('/api', invoiceRoutes);
// app.use('/api', notificationRoutes);
// app.use('/api', productRoutes);
app.use('/api', shopRoutes);
// app.use('/api', userRoutes);

app.get('/', function(req, res){
  return res.send("Apex-tek API is live...")
})






// SET VIEW ENGINE FOR EMAIL TEMPLATES....
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'templates', 'emails'));


//setup server to listen on port declared on env
app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
})


