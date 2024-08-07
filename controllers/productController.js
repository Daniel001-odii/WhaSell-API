const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Shop = require('../models/shopModel');
const Product = require('../models/productModel');
const Notification = require('../models/notificationModel');

const multer = require('multer');

const upload = require('../utils/uploadConfig');
const { productImageUpload } = require('../utils/uploadConfig');

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

// Create a multer instance with the storage configuration
// const upload = multer({ storage: storage });

// Controller function to handle product image uploads
exports.uploadProductImages = (req, res) => {
    upload.array('images', 10)(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const imagePaths = req.files.map(file => file.path);

        try {
            // const product = new Product({
            //     ...req.body,
            //     images: imagePaths
            // });

            // await product.save();
            res.status(201).json({ message: 'Product created successfully', imagePaths });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
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
    try{
        const product_id = req.params.product_id;
        const product = await Product.findById(product_id);

        // increment product views..
        product.views += 1;
        await product.save();

        res.status(200).json({ product });
    }catch(error){
        console.log("error getting product: ", error);
        res.status(500).json({ message: 'internal server error'});
    }
}

// controller to upload product
exports.newProduct = async (req, res) => {
    try{
        const user_id = req.user;
        const user = await User.findById(user_id).populate();

        const { name, description, category, image, condition, price, charge_for_delivery, price_negotiable, delivery_fee } = req.body;
        
        const new_product = new Product({
            name,
            description,
            category,
            image,
            condition,
            price,
            charge_for_delivery,
            price_negotiable,
            delivery_fee,
            shop: user.shop,
        });

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
      const font = await jimp.loadFont(jimp.FONT_SANS_16_WHITE); // Load a white font
  
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

exports.createProduct = async (req, res) => {
    try {
      const user_id = req.user;
      const user = await User.findById(user_id).populate("shop");
  
      // Handle image upload
      productImageUpload.array('product_images', 5)(req, res, async function (err) {
        if (err) {
          return res.status(400).json({ message: 'Image upload failed', err });
        }
  
        if (!req.files || req.files.length == 0) {
          return res.status(400).send({ message: 'Please add at least one product image' });
        }
  
        const { name, description, price, category, condition, charge_for_delivery, delivery_fee, price_negotiable } = req.body;
  
        // Apply watermark to each uploaded image
        try {
          const watermarkPromises = req.files.map(file => addWatermark(file.path, user.shop.name));
          await Promise.all(watermarkPromises);
        } catch (error) {
          console.log("Error applying watermark: ", error);
          return res.status(500).send({ error: 'Failed to apply watermark.' });
        }
  
        // Prepare image URLs
        // const images = req.files.map(file => (__dirname, file.path));
        const images = req.files.map(file => getFullUrl(req, file.path));
  
        // Create a new product
        const newProduct = new Product({
          name,
          description,
          images,
          price,
          category,
          condition,
          charge_for_delivery,
          delivery_fee,
          price_negotiable,
          shop: user.shop._id,
        });
  
        // Save the product to the database
        const savedProduct = await newProduct.save();
  
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
      });
    } catch (error) {
      console.log("Error uploading product: ", error);
      res.status(500).json({ message: "Internal server error" });
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

// Get similar items.. if not get every other items...
