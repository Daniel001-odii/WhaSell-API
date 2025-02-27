// shop routes...
const express = require("express");
const router = express.Router();
const  { protect } = require("../middlewares/authMiddleware");
const shopController = require("../controllers/shopController");


// create new shop....
router.post("/new", protect, shopController.createNewShop);

// get shop by id...
router.get("/:shop_id", shopController.getShopById);

// get shop by shopname...
router.get("/:shop_name/full", shopController.getShopByShopname);

// get shop by user....
router.get("/user/all", protect, shopController.getUserShop);

// edit shop by shop_id...
router.patch("/:shop_id/edit", protect, shopController.editShop);

// follow shop...
router.post("/:shop_id/follow", protect, shopController.followStore);

// add views to shop...
router.get("/:shop_name/view", shopController.addViewToStore);

// get all shops...
router.get("/list/all", shopController.getAllShops);

//change shop image...
router.post("/:shop_id/image", protect, shopController.changeShopImage) 


// get shops near user..
router.get("/near_me/:user_state/all", shopController.getShopsInNearByStates);

// get all boosted shops...
router.get("/boosted/all", shopController.getBoostedShops);


router.get("/data/analytics", protect, shopController.getShopsAnalytics);

// get glips from followed shops..
// router.get("/followed/all_glips", protect, shopController.getGlipsByFollowedShops);

// get all glips
router.get("/glips/all", shopController.getAllGlips);

// check existing_shop name..
router.get("/name_check/:shop_name", shopController.checkExistingShopName);


// boost shop...
router.post("/boost_shop", protect, shopController.boostShop);

// cancel shop boost...
router.post("/boost_shop/cancel", protect, shopController.cancelShopBoost);


module.exports = router;

