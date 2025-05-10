// product routes...
const express = require("express");
const router = express.Router();
const  { protect } = require("../middlewares/authMiddleware");

const productController = require('../controllers/productController');
const { checkcoins } = require("../middlewares/coins.middleware");
const { deleteVideo } = require("../utils/cloudinaryVideo");
const { 
    getPendingDeliveryProducts,
    confirmProductSent,
    confirmProductReceived 
} = require('../controllers/productDeliveryController');

// routes goes here...
router.get('', productController.getAllProducts);

// Get products that need delivery confirmation for the logged-in shop owner
router.get('/pending-delivery', protect, getPendingDeliveryProducts);

// Confirm product sent by seller
router.put('/delivery/confirm-sent/:transactionId', protect, confirmProductSent);

// Confirm product received by buyer
router.put('/delivery/confirm-received/:transactionId', confirmProductReceived);

// get all glips
// router.get('', productController.getAllProducts);

router.get('/:product_id', productController.getProductById);

// upload new product
router.post('/new', protect, checkcoins, productController.newProduct);


// IMAGE HANDLERS...
router.post('/image', productController.uploadProductImages);


// FILE DELETE HANDLER
router.delete('/image/delete', productController.deleteUpload);


// get shop products by shop id or shop name...
router.get('/:shop_name/shop', productController.getProductsByShopId);


// delete product by its ID...
router.delete('/:product_id/delete', protect, productController.deleteProductById);

// add product to likes...
router.post('/:product_id/like', protect, productController.addProductToLikes);

// edit product...
router.put('/:product_id/edit', protect, productController.editProduct);

// search products...
router.get('/search/product', productController.searchProducts);

// get products by category name
router.get('/products_by_category/:categoryName', productController.getProductsByCategory);

// get similar products...
router.get('/similar/all', productController.getSimilarProducts);

// checkpout product...
router.post('/:product_id/checkout', protect, productController.checkoutProduct);

// verify product payment...
router.get('/verify/product_payment', productController.verifyProductPayment);

/* 
**
    GLIPS...
**
*/

// VIDEO HANDLER
router.post('/video', productController.uploadGlipVideo);

// get glips by shop id...
router.get('/glips/:shop_id/all', productController.getGlipsByShopId);

// upload new glip video
router.post('/glips/new', protect, checkcoins, productController.newGlipVideo);

router.delete('/glips/delete/:publicId', deleteVideo)

// get glips from all shops...
router.get('/glips/all_shops', productController.getAllGlipsGroupedByShop);

router.get('/glips/details/:glip_id', productController.getGlipDetailById);

// get glips from followed shops...
router.get('/glips/followed_shops/all_glips', protect, productController.getAllGlipsGroupedByShopFollowing);

// get all glips...
router.get('/glips/all', productController.getAllGlips);

// delete glip by its ID...
router.delete('/glips/:glip_id/delete', protect, productController.deleteGlipById);

module.exports = router;