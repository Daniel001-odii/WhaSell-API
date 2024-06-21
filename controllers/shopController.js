
// CREATE
// READ
// UPDATE
// DELETE CONTROLLERs HERE
const Shop = require("../models/shopModel");
const Invoice = require("../models/invoiceModel")
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel")



// CREATE A NEW SHOP...
exports.createNewShop = async (req, res) => {
    try {
        // get shop name and description via request body
        const { name, description } = req.body;

        // get shop owner via request param
        const shopOwner = req.params.owner;

        const shopNameArray = name.split(" ").join("");

        // check if store name already exists..
        const exisitngShop = await Shop.findOne({ name: shopNameArray });

       

        if(exisitngShop){
            return res.status(400).json({ success: false, message: `shop with name already exists, other shop name suggestions: ${name}-${shopOwner} or ${name}-${shopNameArray[0,5]} or ${name}-${shopOwner[0]}`})
        }

        // create and save new shop object...
        const shop = new Shop({
            name: shopNameArray,
            description,
        });
        await shop.save();

        console.log("request body: ", req.body);

        res.status(200).json({ success: true, message: "New shop created successfully!", shop});

    } catch (error) {;
        const ERROR = error.response
        res.status(500).json({ success: false, message: `Failed to create shop`,ERROR });
        console.log("Error creating new shop: ", error);
    }
};

// GET A SHOP BY ITS NAME...
exports.getShopByShopname = async (req, res) => {
    try{
        const name = req.params.shop_name;

        const shop = await Shop.findOne({ name });

        if(!shop){
           return res.status(404).json({ success: false, message: "shop not found, please check spelling."})
        }

        res.status(200).json({ success: true, shop });

    }catch(error){
        const ERROR = error.response
        res.status(500).json({ success: false, message: `Failed to get shop`,ERROR });
        console.log("Error creating new shop: ", error);
    }
};

// EDIT SHOP...
exports.editShop = async (req, res) => {
    try {
        const shop_id = req.params.shop_id;
        let shop = await Shop.findById(shop_id);

        const {
            name,
            description,
            category,
            profile: {
                location: {
                    city,
                    LGA,
                    state,
                    address,
                },
                phone,
            },
        } = req.body;

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        // Update shop details
        if (name) shop.name = name;
        if (description) shop.description = description;
        if (category) shop.category = category;
        if(shop.profile){
            if (city) shop.profile.location.city = city;
            if (LGA) shop.profile.location.LGA = LGA;
            if (state) shop.profile.location.state = state;
            if (address) shop.profile.location.address = address;
            if (phone) shop.profile.phone = phone;
        }
        

        // Save updated shop
        await shop.save();

        res.status(200).json({ success: true, message: "Shop updated successfully", shop });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to edit shop", error: error.message });
        console.log("Error editing shop: ", error);
    }
}






