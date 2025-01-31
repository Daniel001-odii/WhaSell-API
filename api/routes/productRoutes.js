// product routes...
const express = require("express");
const router = express.Router();
const  { protect } = require("../middlewares/authMiddleware");

const productController = require('../controllers/productController');
const { checkcoins } = require("../middlewares/coins.middleware");

// routes goes here...
router.get('', productController.getAllProducts);

// get all glips
// router.get('', productController.getAllProducts);

router.get('/:product_id', productController.getProductById);

// upload new product
router.post('/new', protect, checkcoins, productController.newProduct);


// IMAGE HANDLERS...
router.post('/image', productController.uploadProductImages);


// FILE DELETE HANDLER
router.delete('/image/delete', productController.deleteUpload);


// get shop products by shop id...
router.get('/:shop_id/shop', productController.getProductsByShopId);


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




module.exports = router;