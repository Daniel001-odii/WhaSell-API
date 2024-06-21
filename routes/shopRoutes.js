// shop routes...
const express = require("express");
const router = express.Router();

const shopController = require("../controllers/shopController");


// create new shop....
router.post("/shops/:owner/new", shopController.createNewShop);

// get shop by shopname...
router.get("/shops/:shop_name", shopController.getShopByShopname);

// edit shop by shop_id...
router.patch("/shops/:shop_id/edit", shopController.editShop);


module.exports = router;

