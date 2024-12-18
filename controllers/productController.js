const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Shop = require('../models/shopModel');
const Product = require('../models/productModel');
const Notification = require('../models/notificationModel');
const Glip = require("../models/glipModel")
const multer = require('multer');

const upload = require('../utils/uploadConfig');

const walletModel = require('../models/walletModel');

// new import...
const { productImageUpload } = require('../utils/uploadConfig');
const { initializeFormidable } = require('../config/formidable.config');


// Set up multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'product_images/'); // Specify the destination folder for uploaded images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Use a unique filename to avoid conflicts
    }
});

const jimp = require('jimp');
const watermark = require('jimp-watermark');

const getFullUrl = require('../utils/getFullPath');
const productModel = require('../models/productModel');
const userModel = require('../models/userModel');

const { uploadProductImages, uploadGlipVideo } = require("../utils/firebaseFileUpload");
const { deleteFile } = require('../utils/firebaseFileUpload');


// Create a multer instance with the storage configuration
// const upload = multer({ storage: storage });

// Controller function to handle product image uploads
exports.uploadProductImages = async (req, res) => {
   const form = initializeFormidable();

   form.parse(req, async (err, fields, files) => {
    if(err){
      return res.status(500).json({ message: "error uploading images", err});
    };

    // if(!req.files){
    //   return res.status(400).json({ message: "please attach an image file"});
    // }

    const file = files['images'][0];

    // Apply watermark to each uploaded image
    try {
      const watermarkPromises = addWatermark(file.filepath, "...");
      await watermarkPromises;
    } catch (error) {
      console.log("Error applying watermark: ", error);
      return res.status(500).send({ error: 'Failed to apply watermark.' });
    }

    const result = await uploadProductImages(file);

    if(result.success) {
      res.status(200).json({result});
    } else {
      res.status(500).json(result);
    }

   })
};

exports.uploadGlipVideo = async (req, res) => {
  const form = initializeFormidable();

  form.parse(req, async (err, fields, files) => {
   if(err){
     return res.status(500).json({ message: "error uploading glip video", err});
   };
   const file = files['video'][0];
   const result = await uploadGlipVideo(file);

   if(result.success) {
     res.status(200).json({result});
   } else {
     res.status(500).json(result);
   }

  })
};

exports.deleteUpload = async (req, res) => {
  const { filePath }= req.body // Assume the file path is sent in the request body

  console.log("client: ", req.body)

  if (!filePath) {
    return res.status(400).json({ success: false, error: 'File path is required.' });
  }

  const decodedFilePath = decodeURIComponent(filePath);

  console.log("attempting to delete: ", decodedFilePath)

  const result = await deleteFile(decodedFilePath);

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
};

// Create
// Read
// Update
// Delete

// controller to get all products from...
exports.getAllProducts = async (req, res) => {
    try{
        const products = await Product.find().populate("shop");

        res.status(200).json({ products });

    }catch(error){
        res.status(500).json({ message: 'internal server error'});
    }
}

// get product by its ID....
exports.getProductById = async (req, res) => {
  try {
      const product_id = req.params.product_id;

      // Get the 'viewed_products' cookie (if it exists)
      let viewedProducts = req.cookies.viewed_products;

      if (!viewedProducts) {
          // Initialize the cookie if it doesn't exist
          viewedProducts = [];
      } else {
          // Parse the cookie if it exists
          viewedProducts = JSON.parse(viewedProducts);
      }

      const product = await Product.findById(product_id);

      // Increment product views only if the product is not in the viewedProducts array
      if (!viewedProducts.includes(product_id)) {
          product.views += 1;
          await product.save();

          // Add the product_id to the viewedProducts array
          viewedProducts.push(product_id);

          // Update the 'viewed_products' cookie with the new array
          res.cookie('viewed_products', JSON.stringify(viewedProducts), {
              maxAge: 30 * 24 * 60 * 60 * 1000, // Cookie expires in 30 days
              httpOnly: true // Makes the cookie inaccessible to JavaScript in the browser (optional, for security)
          });
      }

      res.status(200).json({ product });
  } catch (error) {
      console.log("error getting product: ", error);
      res.status(500).json({ message: 'internal server error' });
  }
};


// controller to upload product
exports.newGlipVideo = async (req, res) => {
    try{
        const user_id = req.user;
        const user = await User.findById(user_id).populate();

        const { name, description, category, video_url, condition, price, charge_for_delivery, price_negotiable, delivery_fee } = req.body;
        console.log('client: ', req.body)
        const new_glip = new Glip({
            name,
            description,
            category,
            video_url,
            condition,
            price,
            charge_for_delivery,
            price_negotiable,
            delivery_fee,
            shop: user.shop,
        });

        await new_glip.save();

        res.status(200).json({ message: "New glip uploaded successfully!", glip: new_glip, user });

        // send a notification when new product is uploaded...

    }catch(error){
        res.status(500).json({ message: 'Error uploading glip', error});
        console.log(`error uploading glip: ${error}`);
    }
}

/* 
uploading a single product deducts 2 coins from the user's balance...
*/
exports.newProduct = async (req, res) => {
  try{
      const user_id = req.user;
      const user = await User.findById(user_id).populate();

      const { name, description, category, images, condition, price, charge_for_delivery, price_negotiable, delivery_fee } = req.body;
      console.log('client: ', req.body);


      const new_product = new Product({
          name,
          description,
          category,
          images,
          condition,
          price,
          charge_for_delivery,
          price_negotiable,
          delivery_fee,
          shop: user.shop,
      });

      

      // perform coins deduction here and send transaction logs too...
      // check coin balance...
      const wallet = await walletModel.findOne({ user: user_id });
      const user_balance = wallet.balance;

      // check for low coin balance...
     /*  if(user_balance == 0){
          console.log("insufficient coins balance please top-up!");
          return res.status(400).json({ message: "insufficient coin balance, please purchase more coins!"})
      } */
      
      const upload_fee = 2
      const wallet_balance = user_balance - upload_fee;
      wallet.balance = wallet_balance;

      const today = new Date();
      wallet.debit_transactions.push({
        date: today,
        coin_amount: upload_fee,
        narration: 'debit for product listing'
      })
      await wallet.save();
      await new_product.save();



      res.status(200).json({ message: "New product uploaded successfully!", product: new_product, user });

      // send a notification when new product is uploaded...

  }catch(error){
      res.status(500).json({ message: 'Error uploading product', error});
      console.log(`error uploading product: ${error}`);
  }
}


// Function to add watermark
const addWatermark = async (filePath, full_text) => {
    try {
      const image = await jimp.read(filePath);
      const font = await jimp.loadFont(jimp.FONT_SANS_32_WHITE); // Load a white font
  
      // Create a separate text image with the watermark
      const textImage = new jimp(image.bitmap.width, image.bitmap.height);
      textImage.print(
        font,
        0,
        0,
        {
          text: `${full_text} posted on whatsell.com`,
          alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: jimp.VERTICAL_ALIGN_MIDDLE,
        },
        image.bitmap.width,
        image.bitmap.height
      );
  
      // Apply opacity to the text image
      textImage.opacity(0.5);
  
      // Composite the text image over the original image
      image.composite(textImage, 0, 0);
  
      await image.writeAsync(filePath);
    } catch (err) {
      throw new Error('Error applying watermark');
    }
};


// get products by shop id..
exports.getProductsByShopId = async (req, res) => {
    try{
        const shop_id = req.params.shop_id;
        const shop = await Shop.findById(shop_id);
        if(!shop){
            res.status(404).json({ message: "shop not found"});
        }

        const products = await Product.find({ shop: shop_id })
        res.status(200).json({ products });

    }catch(error){
        res.status(500).json({ message: 'internal server error'});
        console.log("error getting products by shop id: ", error);
    }
}


// get products by shop id..
exports.getGlipsByShopId = async (req, res) => {
  try{
      const shop_id = req.params.shop_id;
      const shop = await Shop.findById(shop_id);
      if(!shop){
          res.status(404).json({ message: "shop not found"});
      }

      const glips = await Glip.find({ shop: shop_id })
      res.status(200).json({ glips });

  }catch(error){
      res.status(500).json({ message: 'internal server error'});
      console.log("error getting glips by shop id: ", error);
  }
}

// delete product...
exports.deleteProductById = async (req, res) => {
  try{
    const product_id = req.params.product_id;
    const product = await productModel.findById(product_id);

    if(!product){
      return res.status(404).json({ message: "cannot find requested product"});
    }

    await product.deleteOne({ _id:product_id });
    res.status(201).json({ message: "product deleted successfully"});

  }catch(error){
    console.log("error deleting product: ", error);
    res.status(500).json({ message: "internal server error"});
  }
};

exports.addProductToLikes = async (req, res) => {
  try {
    const product_id = req.params.product_id;
    const product = await productModel.findById(product_id);

    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }

    const user = await userModel.findById(req.user);

    // Check if the product is already in the user's liked products
    const isLiked = user.liked_products.includes(product_id);

    if (isLiked) {
      // If already liked, remove the product from liked_products
      user.liked_products = user.liked_products.filter(id => id.toString() !== product_id.toString());
      await user.save();
      return res.status(200).json({ message: "Product removed from liked products" });
    } else {
      // If not liked, add the product to liked_products
      user.liked_products.push(product_id);
      await user.save();
      return res.status(201).json({ message: "Product added to liked products" });
    }

  } catch (error) {
    console.log("Error adding product to likes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




// Get similar items.. if not get every other items...
