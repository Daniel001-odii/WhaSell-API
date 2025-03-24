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
      // const watermarkPromises = addWatermark(file.filepath, "...");
      // await watermarkPromises;
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


// USES CLOUDINARY
const { uploadVideo } = require('../utils/cloudinaryVideo');
exports.uploadGlipVideo = async (req, res) => {
  const form = initializeFormidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: "Error uploading video", error: err });
    }

    const file = files['video'][0];

    try {
      const result = await uploadVideo(file.filepath);

      if (result) {
        return res.status(200).json({
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
        });
      } else {
        return res.status(500).json({ message: "Upload failed" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Upload error", error });
    }
  });
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

// Controller to search products based on keywords
exports.searchProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword;

    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required for searching" });
    }

    const searchRegex = new RegExp(keyword, 'i'); // Case-insensitive search

    const alternate_products = await Product.find();

    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { condition: searchRegex }
      ]
    });

    const glips = await Glip.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { condition: searchRegex }
      ]
    });

   /*  if(products.length > 0){
      return res.status(200).json({ products });
    } else {
      return res.status(201).json({ alternate_products });
    } */

    res.status(200).json({ products, glips, alternate_products });
   
  } catch (error) {
    console.log("Error searching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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

      const product = await Product.findById(product_id)
      .populate({
        path: "shop",
        populate: {
          path:"owner"
        }
      });

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

        const { name, description, category, video_url, condition, price, charge_for_delivery, price_negotiable, delivery_fee, thumbnail } = req.body;
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
            thumbnail,
        });

        // perform coins deduction here and send transaction logs too...
      // check coin balance...
      const wallet = await walletModel.findOne({ user: user_id });
      const user_balance = wallet.balance;

      // check for low coin balance...
      if(user_balance == 0){
          console.log("insufficient coins balance please top-up!");
          return res.status(400).json({ message: "insufficient coin balance, please purchase more coins!"})
      }
      
      // DEBIT COINS CREDITS FOR PRODUCT UPLOAD...
      const upload_fee = 5
      const wallet_balance = user_balance - upload_fee;
      wallet.balance = wallet_balance;

      const today = new Date();
      wallet.debit_transactions.push({
        date: today,
        coin_amount: upload_fee,
        narration: 'debit for product listing'
      })
      await wallet.save();

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
      // console.log('client: ', req.body);
      console.log("user trying upload: ", user);


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
          shop: user.shop._id,
      });

      

      // perform coins deduction here and send transaction logs too...
      // check coin balance...
      const wallet = await walletModel.findOne({ user: user_id });
      const user_balance = wallet.balance;

      // check for low coin balance...
      if(user_balance == 0){
          console.log("insufficient coins balance please top-up!");
          return res.status(400).json({ message: "insufficient coin balance, please purchase more coins!"})
      }
      
      // DEBIT COINS CREDITS FOR PRODUCT UPLOAD...
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


// get products by shop id with pagination..
exports.getProductsByShopId = async (req, res) => {
  try {
    const shop_name = req.params.shop_name.toLowerCase();;


    const shop = await Shop.findOne({ name: shop_name });
    if (!shop) {
      return res.status(404).json({ message: "shop not found" });
    }

    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10

    const products = await Product.find({ shop: shop._id })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments({ shop: shop._id });

    res.status(200).json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      totalProducts,
    });

  } catch (error) {
    res.status(500).json({ message: 'internal server error' });
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

      const glips = await Glip.find({ shop: shop_id }).populate({
        path: "shop",
        populate: {
          path:"owner"
        }
      });
      glips.reverse()
      res.status(200).json({ glips });

  }catch(error){
      res.status(500).json({ message: 'internal server error'});
      console.log("error getting glips by shop id: ", error);
  }
}

// get all glips grouped by shops...
exports.getAllGlipsGroupedByShop = async (req, res) => {
  try {
    // Fetch all shops with selected details
    const shops = await Shop.find()

    // Create an array to store the final result
    const shopsWithGlips = await Promise.all(
      shops.map(async (shop) => {
        // Fetch all glips for this shop
        const glips = await Glip.find({ shop: shop._id }).populate({
          path: "shop",
          populate: {
            path:"owner"
          }
        });

        // Return shop details with its glips
        return {
          shop,
          glips: glips
        };
      })
    );

    // Filter out shops that have no glips (optional)
    const result = shopsWithGlips.filter(shopGroup => shopGroup.glips.length > 0);
    result.reverse();
    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.log("error getting glips grouped by shop: ", error);
    res.status(500).json({ 
      success: false,
      message: 'internal server error'
    });
  }
};

exports.getAllGlipsGroupedByShopFollowing = async (req, res) => {
  try {
    const user_id = req.user;
    const user = await userModel.findById(user_id);

    const followed_shops = await Shop.find({ _id: { $in: user.followed_shops }})
    // Fetch all followed_shops with selected details
    // const followed_shops = await Shop.find()

    // Create an array to store the final result
    const shopsWithGlips = await Promise.all(
      followed_shops.map(async (shop) => {
        // Fetch all glips for this shop
        const glips = await Glip.find({ shop: shop._id }).populate({
          path: "shop",
          populate: {
            path:"owner"
          }
        });

        // Return shop details with its glips
        return {
          shop,
          glips: glips
        };
      })
    );

    // Filter out followed_shops that have no glips (optional)
    const result = shopsWithGlips.reverse().filter(shopGroup => shopGroup.glips.length > 0);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.log("error getting glips grouped by shop: ", error);
    res.status(500).json({ 
      success: false,
      message: 'internal server error'
    });
  }
};

// get glip by id..
// get product by its ID....
exports.getGlipDetailById = async (req, res) => {
  try {
      const glip_id = req.params.glip_id;

      const glip = await Glip.findById(glip_id)
      .populate({
        path: "shop",
        populate: {
          path:"owner"
        }
      });

      const all_glips = await Glip.find().populate({
        path: "shop",
        populate: {
          path:"owner"
        }
      });

      const result = [glip, ...all_glips];

      res.status(200).json({ result });
  } catch (error) {
      console.log("error getting glip: ", error);
      res.status(500).json({ message: 'internal server error' });
  }
};

exports.getAllGlips = async (req, res) => {
try{
  const glips = await Glip.find().populate({
    path: "shop",
    populate: {
      path:"owner"
    }
  });
  glips.reverse();
  res.status(200).json({ glips });
}catch(err){
  res.status(500).json({ message: 'internal server error'});
}
}

// delete product...
exports.deleteGlipById = async (req, res) => {
  try {
    const glip_id = req.params.glip_id;
    const glip = await Glip.findById(glip_id);

    if (!glip) {
      return res.status(404).json({ message: "Cannot find requested glip" });
    }

    await glip.deleteOne({ _id: glip_id });
    res.status(201).json({ message: "Glip deleted successfully" });

  } catch (error) {
    console.log("Error deleting glip: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



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
      return res.status(200).json({ is_liked: false, message: "Product removed from liked products" });
    } else {
      // If not liked, add the product to liked_products
      user.liked_products.push(product_id);
      await user.save();
      return res.status(201).json({ is_liked: true, message: "Product added to liked products" });
    }

  } catch (error) {
    console.log("Error adding product to likes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/* 
  edit a product
*/
/* name
description
price
category
charge_for_delivery
 */
exports.editProduct = async (req, res) => {
  try {
    const product_id = req.params.product_id;
    const { 
      name,
      description,
      price,
      category,
      charge_for_delivery
    } = req.body.product;

    console.log("from client: ", req.body)
    const product = await Product.findById(product_id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update the product with the new data
    /* Object.keys(updates).forEach(key => {
      product[key] = updates[key];
    }); */
    product.name = name ? name : product.name;
    product.description = description ? description : product.description;
    product.price = price ? price : product.price;
    product.category = name ? category : product.category;
    product.charge_for_delivery = charge_for_delivery ? charge_for_delivery : product.charge_for_delivery;


    await product.save();

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.log("Error updating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// get product by category..

exports.getProductsByCategory = async (req, res) => {
  try {
      const { categoryName } = req.params;

      // Check if the categoryName is provided
      if (!categoryName) {
          return res.status(400).json({
              success: false,
              message: "Category name is required"
          });
      }

      // Fetch all products that match the category name
      const products = await Product.find({ category: categoryName });

      // Check if products exist for the category
      if (products.length === 0) {
          return res.status(404).json({
              success: false,
              message: `No products found for category: ${categoryName}`
          });
      }

      // Get the first image of the first product
      const headerImage = products[0]?.images?.[0] || null;

      res.status(200).json({
          success: true,
          header_image: headerImage,
          data: products
      });
  } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({
          success: false,
          message: "Internal Server Error"
      });
  }
};

// Get similar items.. if not get every other items...
exports.getSimilarProducts = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required for searching similar products" });
    }

    const searchRegex = new RegExp(keyword, 'i'); // Case-insensitive search

    const similarProducts = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { condition: searchRegex }
      ]
    });

    if (similarProducts.length > 0) {
      return res.status(200).json({ products: similarProducts });
    } else {
      const recentProducts = await Product.find().sort({ createdAt: -1 }).limit(10);
      return res.status(200).json({ products: recentProducts });
    }
  } catch (error) {
    console.log("Error getting similar products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


