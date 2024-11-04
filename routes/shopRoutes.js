// shop routes...
const express = require("express");
const router = express.Router();
const  { protect } = require("../middlewares/authMiddleware");
const shopController = require("../controllers/shopController");


// create new shop....
router.post("/shops/new", protect, shopController.createNewShop);

// get shop by id...
router.get("/shops/:shop_id", shopController.getShopById);

// get shop by shopname...
router.get("/shops/:shop_name/full", shopController.getShopByShopname);

// edit shop by shop_id...
router.patch("/shops/:shop_id/edit", protect, shopController.editShop);

// follow shop...
router.post("/shops/:shop_id/follow", protect, shopController.followStore);

// add views to shop...
router.get("/shops/:shop_id/view", shopController.addViewToStore);

// get all shops...
router.get("/shops/list/all", shopController.getAllShops);

//change shop image...
router.post("/shops/:shop_id/image", protect, shopController.changeShopImage) 


// get shops near user..
router.get("/shops/near_me/:user_state/all", shopController.getShopsInNearByStates);

// get all boosted shops...
router.get("/shops/boosted/all", shopController.getBoostedShops);


router.get("/shops/data/analytics", protect, shopController.getShopsAnalytics);

module.exports = router;

