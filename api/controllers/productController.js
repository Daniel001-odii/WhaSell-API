const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Shop = require('../models/shopModel');
const Product = require('../models/productModel');
const Notification = require('../models/notificationModel');
const Glip = require("../models/glipModel")
const multer = require('multer');
const sendEmail = require('../utils/sendEmail');
const { EMAIL_HEADER_SECTION, EMAIL_FOOTER_SECTION } = require('../utils/emailTemplates');
const Transaction = require('../models/transactionModel');
const CoinTransaction = require('../models/coinTransactionModel');

const upload = require('../utils/uploadConfig');

const walletModel = require('../models/walletModel');

// new import...
const { productImageUpload } = require('../utils/uploadConfig');
const { initializeFormidable } = require('../config/formidable.config');

const axios = require('axios');
// const { PLATFORM_FEE_PERCENTAGE } = require('../config/firebase.config');
const PLATFORM_FEE_PERCENTAGE = 2;

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
          path: "owner",
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
    try {
        const user_id = req.user;
        const user = await User.findById(user_id).populate();

        const { name, description, category, video_url, condition, price, charge_for_delivery, price_negotiable, delivery_fee, thumbnail } = req.body;
        console.log('client: ', req.body);
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

        // Check coin balance
        const wallet = await walletModel.findOne({ user: user_id });
        const user_balance = wallet.credit_balance;

        if (user_balance < 5) {
            console.log("insufficient coins balance please top-up!");
            return res.status(400).json({ message: "insufficient coin balance, please purchase more coins!" });
        }

        // Create coin transaction record
        const reference = `GLIP_UPLOAD_${Date.now()}`;
        const coinTransaction = new CoinTransaction({
            user: user_id,
            type: 'debit',
            amount: 5,
            balance_after: user_balance - 5,
            reference,
            status: 'completed',
            narration: 'Debit for glip video upload'
        });
        await coinTransaction.save();

        // Update wallet balance
        wallet.credit_balance = user_balance - 5;
        await wallet.save();

        await new_glip.save();
        res.status(200).json({ message: "New glip uploaded successfully!", glip: new_glip, user });

    } catch (error) {
        res.status(500).json({ message: 'Error uploading glip', error });
        console.log(`error uploading glip: ${error}`);
    }
};

/* 
uploading a single product deducts 2 coins from the user's balance...
*/
// Sample JSON for testing newProduct endpoint in Postman:
/*
{
    "name": "Test Product",
    "description": "This is a test product description",
    "category": "Electronics",
    "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
    ],
    "condition": "New", 
    "price": 50000,
    "charge_for_delivery": true,
    "price_negotiable": true,
    "delivery_fee": 2000
}

Headers required:
Authorization: Bearer <your_jwt_token>

Notes:
- Make sure the user has sufficient coin balance (minimum 2 coins)
- The user must have a shop created
- Send as a POST request to /api/products/new
- All fields are required
*/

exports.newProduct = async (req, res) => {
    try {
        const user_id = req.user;
        const user = await User.findById(user_id).populate();

        const { name, description, category, images, condition, price, charge_for_delivery, price_negotiable, delivery_fee } = req.body;
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

        // Check coin balance
        const wallet = await walletModel.findOne({ user: user_id });
        const user_balance = wallet.credit_balance;

        if (user_balance < 2) {
            console.log("insufficient coins balance please top-up!");
            return res.status(400).json({ message: "insufficient coin balance, please purchase more coins!" });
        }

        // Create coin transaction record
        const reference = `PRODUCT_UPLOAD_${Date.now()}`;
        const coinTransaction = new CoinTransaction({
            user: user_id,
            type: 'debit',
            amount: 2,
            balance_after: user_balance - 2,
            reference,
            status: 'completed',
            narration: 'Debit for product upload'
        });
        await coinTransaction.save();

        // Update wallet balance
        wallet.credit_balance = user_balance - 2;
        await wallet.save();

        await new_product.save();
        res.status(200).json({ message: "New product uploaded successfully!", product: new_product, user });

    } catch (error) {
        res.status(500).json({ message: 'Error uploading product', error });
        console.log(`error uploading product: ${error}`);
    }
};


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
    const product = await productModel.findById(product_id).populate({
      path: 'shop',
      populate: {
        path: 'owner',
        select: 'email username'
      }
    });

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

      // Create notification for product owner
      if (product.shop && product.shop.owner) {
        const notification = new Notification({
          recipient: product.shop.owner._id,
          type: 'like',
          title: 'New Product Like',
          message: `Someone liked your product "${product.name}"`,
          related_product: product._id,
          related_shop: product.shop._id,
          metadata: {
            product_name: product.name,
            product_image: product.images[0]
          }
        });
        await notification.save();

        // Send email notification if user has email notifications enabled
        if (product.shop.owner.email) {
          const emailHtml = `
            <table style="width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              ${EMAIL_HEADER_SECTION}
              <tr>
                <td style="padding: 20px;">
                  <h2>Your Product Got a New Like! 🎉</h2>
                  <p>Hello ${product.shop.owner.username},</p>
                  <p>Great news! Someone just liked your product "${product.name}".</p>
                  <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                    <p style="margin: 0;"><strong>Product Details:</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>Name: ${product.name}</li>
                      <li>Price: ₦${product.price.toLocaleString()}</li>
                      <li>Category: ${product.category}</li>
                    </ul>
                  </div>
                  <p>Keep up the great work! This engagement helps increase your product's visibility.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}/product/${product._id}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">View Product</a>
                  </div>
                </td>
              </tr>
              ${EMAIL_FOOTER_SECTION}
            </table>
          `;

          try {
            await sendEmail({
              emailTo: product.shop.owner.email,
              subject: `New Like on Your Product: ${product.name}`,
              html: emailHtml
            });
          } catch (error) {
            console.error('Failed to send like notification email:', error);
            // Don't fail the like operation if email fails
          }
        }
      }

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

/**
 * Checkout a single product and redirect to Paystack for payment
 * @route POST /api/products/:product_id/checkout
 * @body { email: string, name?: string, phone?: string, delivery_info?: object }
 */
exports.checkoutProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { email, name, phone, delivery_info } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Buyer email is required' });
    }

    // Fetch product and populate shop/owner
    const product = await Product.findById(product_id).populate({ path: 'shop', populate: { path: 'owner' } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.status.value === 'sold') {
      return res.status(400).json({ message: 'Product already sold' });
    }

    const price = product.price + product.delivery_fee;
    const seller = product.shop.owner;
    if (!seller) {
      return res.status(400).json({ message: 'Seller not found for this product' });
    }

    // Calculate fees
    const platformFee = (price * PLATFORM_FEE_PERCENTAGE) / 100;
    const sellerAmount = price - platformFee;

    // Create transaction record
    const reference = `CHECKOUT_${product_id}_${Date.now()}`;
    const transaction = new Transaction({
      reference,
      product: product_id,
      buyer: {
        email,
        name,
        phone
      },
      seller: seller._id,
      amount: price,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      delivery_info: delivery_info || null
    });
    await transaction.save();

    // Prepare Paystack transaction
    const metadata = {
      transaction_id: transaction._id,
      product_id,
      seller_id: seller._id,
      platform_fee_percent: PLATFORM_FEE_PERCENTAGE,
      delivery_info: delivery_info || null,
    };

    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: price * 100, // Paystack expects amount in kobo
        reference,
        metadata,
        callback_url: `${process.env.APP_URL}/payments/verify?type=product`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const { authorization_url } = paystackRes.data.data;
    return res.status(200).json({ payment_url: authorization_url, reference });
  } catch (error) {
    console.error('Error during product checkout:', error.response?.data || error);
    return res.status(500).json({ message: 'Failed to initialize product checkout' });
  }
};

/**
 * Verify product payment via Paystack and transfer funds to seller's pending_funds
 * @route GET /api/products/paystack/verify/:reference
 */
exports.verifyProductPayment = async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ message: 'Transaction reference is required' });
    }

    // Verify payment with Paystack
    const url = `https://api.paystack.co/transaction/verify/${reference}`;
    const options = {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.get(url, options);
    const { data } = response.data;
    
    if (!data) {
      return res.status(400).json({ message: 'Invalid payment verification response' });
    }

    // Find the transaction record
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction record not found' });
    }

    // If transaction is already completed, return success
    if (transaction.status === 'completed') {
      return res.status(200).json({ 
        message: 'Payment already verified',
        data: {
          status: 'success',
          transaction
        }
      });
    }

    if (data.status === 'success') {
      const { transaction_id, product_id, seller_id, platform_fee_percent } = data.metadata;
      const amount = data.amount / 100; // Convert from kobo to Naira
      const platformFee = (amount * platform_fee_percent) / 100;
      const sellerAmount = amount - platformFee;

      // Update transaction record
      transaction.status = 'completed';
      transaction.payment_details = {
        provider_reference: reference,
        payment_date: new Date(),
        payment_method: data.channel || 'card'
      };
      await transaction.save();

      // Fetch seller's wallet and update pending_funds
      const sellerWallet = await walletModel.findOne({ user: seller_id });
      if (!sellerWallet) {
        return res.status(404).json({ message: 'Seller wallet not found' });
      }

      // Update seller's pending funds
      sellerWallet.pending_funds = (sellerWallet.pending_funds || 0) + sellerAmount;
      await sellerWallet.save();

      // Update product status
      const product = await Product.findById(product_id).populate({
        path: 'shop',
        populate: {
          path: 'owner',
          select: 'email username'
        }
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Update product status
      product.status.value = 'sold';
      product.status.date_of_sale = new Date();
      product.status.amount_paid = amount;
      await product.save();

      // Send email notification to seller
      if (product.shop?.owner?.email) {
        const emailHtml = `
          <table style="width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            ${EMAIL_HEADER_SECTION}
            <tr>
              <td style="padding: 20px;">
                <h2>Product Payment Received!</h2>
                <p>Hello ${product.shop.owner.username},</p>
                <p>Great news! Your product "${product.name}" has been successfully purchased.</p>
                <p>Buyer Details:</p>
                <ul>
                  <li>Name: ${transaction.buyer.name || 'Not provided'}</li>
                  <li>Email: ${transaction.buyer.email}</li>
                  <li>Phone: ${transaction.buyer.phone || 'Not provided'}</li>
                </ul>
                <p>Payment Details:</p>
                <ul>
                  <li>Product: ${product.name}</li>
                  <li>Amount Received: ₦${amount.toLocaleString()}</li>
                  <li>Platform Fee: ₦${platformFee.toLocaleString()}</li>
                  <li>Your Earnings: ₦${sellerAmount.toLocaleString()}</li>
                  <li>Date: ${new Date().toLocaleDateString()}</li>
                </ul>
                ${transaction.delivery_info ? `
                <p>Delivery Information:</p>
                <ul>
                  <li>Address: ${transaction.delivery_info.address}</li>
                  <li>City: ${transaction.delivery_info.city}</li>
                  <li>State: ${transaction.delivery_info.state}</li>
                  <li>Phone: ${transaction.delivery_info.phone}</li>
                  ${transaction.delivery_info.additional_notes ? `<li>Additional Notes: ${transaction.delivery_info.additional_notes}</li>` : ''}
                </ul>
                ` : ''}
                <p>The funds have been added to your pending balance. Once the product is delivered and confirmed, the funds will be available in your wallet.</p>
                <p>Please ensure to update the product status to "delivered" once you've shipped the product to the buyer.</p>
              </td>
            </tr>
            ${EMAIL_FOOTER_SECTION}
          </table>
        `;

        try {
          await sendEmail({
            emailTo: product.shop.owner.email,
            subject: 'Payment Received for Your Product',
            html: emailHtml
          });
          console.log(`Payment confirmation email sent to ${product.shop.owner.email} for product ${product.name}`);
        } catch (error) {
          console.error(`Failed to send payment confirmation email to ${product.shop.owner.email}:`, error);
          // Don't fail the whole process if email fails
        }
      }

      return res.status(200).json({ 
        message: 'Payment verified and funds transferred to seller',
        data: {
          status: 'success',
          transaction,
          product: {
            name: product.name,
            status: product.status
          }
        }
      });
    } else {
      // Update transaction status to failed
      transaction.status = 'failed';
      await transaction.save();

      return res.status(400).json({ 
        message: 'Payment verification failed',
        data: {
          status: 'failed',
          transaction
        }
      });
    }
  } catch (error) {
    console.error('Error verifying product payment:', error.response?.data || error);
    
    // If we have a transaction reference, try to update its status
    if (req.query.reference) {
      try {
        const transaction = await Transaction.findOne({ reference: req.query.reference });
        if (transaction) {
          transaction.status = 'failed';
          await transaction.save();
        }
      } catch (updateError) {
        console.error('Error updating transaction status:', updateError);
      }
    }

    return res.status(500).json({ 
      message: 'Failed to verify payment',
      error: error.response?.data || error.message
    });
  }
};


