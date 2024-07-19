// product routes...
const express = require("express");
const router = express.Router();
const  { protect } = require("../middlewares/authMiddleware");

const productController = require('../controllers/productController');

// routes goes here...
router.get('', productController.getAllProducts);

router.get('/:product_id', productController.getProductById);

router.post('/new', protect, productController.createProduct);

router.post('/image', productController.uploadProductImages);

// get shop products by shop id...
router.get('/:shop_id/shop', productController.getProductsByShopId);

module.exports = router;