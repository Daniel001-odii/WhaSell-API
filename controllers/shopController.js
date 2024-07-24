
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
        console.log("from client :", req.body);
        
        const shop_name = name.split(" ").join("-");

        // get shop owner via request param
        const owner = req.user;
        
        // check if store name already exists..
        const exisitngShop = await Shop.findOne({ name: shop_name });

        // check is shop with name already exists
        if(exisitngShop){
            return res.status(400).json({ success: false, message: `shop with name already exists, other shop name suggestions: ${shop_name}-${owner[0]}${owner[1]}, ${shop_name}-${owner[0]}${owner[1]}${owner[2]} or ${shop_name}-${owner[2]}${owner[1]}${owner[0]}`})
        }

        // create and save new shop object...
        const shop = new Shop({
            owner,
            name: shop_name,
            description,
        });
        await shop.save();

        // save shop to userDb...
        const user = await User.findById(owner);
        user.shop = shop;

        // change user account type to seller...
        user.account_type = "seller";
        await user.save();

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
    try {
        // Convert the shop_name parameter to lowercase
        const name = req.params.shop_name.toLowerCase();

        // Find the shop by name (ensure name is stored in lowercase in the database)
        const shop = await Shop.findOne({ name: name });
        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found, please check spelling." });
        }

        
        const shop_id = shop._id;

        // find all products belonging to shop...
        const products = await Product.find({ shop: shop_id });
        shop.products = products;
        shop.listings = products.length;
        // followers count...
        shop.followers_count = shop.followers.length;

        

        res.status(200).json({ success: true, shop });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to get shop`, error: error.message });
        console.log("Error getting shop: ", error);
    }
};

exports.getShopById = async(req, res) => {
    try{
        const shop_id = req.params.shop_id;
        const shop = await Shop.findById(shop_id);

        // find all products belonging to shop...
        const products = await Product.find({ shop: shop_id });
        shop.products = products;
        shop.listings = products.length;
        // followers count...
        shop.followers_count = shop.followers.length;


        if(!shop){
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        res.status(200).json({ shop });
    }catch(error){
        console.log("error getting shop: ", error)
        res.status(500).json({ message: 'internal server error'});
    }
}

// EDIT SHOP...
exports.editShop = async (req, res) => {
    try {
        const form = req.body;
        console.log("from client: ", form);


        const shop_id = req.params.shop_id;
        let shop = await Shop.findById(shop_id);

        const {
            name,
            description,
            category,
            profile
        } = req.body;

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        // Update shop details
        if (name) shop.name = name;
        if (description) shop.description = description;
        if (category) shop.category = category;
        if(profile){
            if(profile.location){
                if (city) shop.profile.location.city = city;
                if (LGA) shop.profile.location.LGA = LGA;
                if (state) shop.profile.location.state = state;
                if (address) shop.profile.location.address = address;
            }
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


// FOLLOW STORE...
exports.followStore = async (req, res) => {
    try {
        const shop_id = req.params.shop_id;
        const user_id = req.user; // Assuming user ID is available in req.user

        let shop = await Shop.findById(shop_id);

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        // Check if the user is already following the shop
        if (shop.followers.includes(user_id)) {
            const user_index = shop.followers.indexOf(user_id);
            if(user_index > -1){
                shop.followers.splice(user_index, 1);
            }
            await shop.save();
            return res.status(201).json({ success: true, message: "You unfollowed this shop" });
        }

        // also dont allow shop owners to follow their own store...
        if(shop.owner == user_id){
            return res.status(400).json({ success: false, message: "sorry, you cant follow your own shop" });
        }

        // Add user to shop's followers
        shop.followers.push(user_id);
        await shop.save();

        // Optionally, update user's followed shops
        /*
        const user = await User.findById(user_id);
        user.followedShops.push(shop_id);
        await user.save();
        */


        res.status(200).json({ success: true, message: "You are now following the shop", shop });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to follow shop", error: error.message });
        console.log("Error following shop: ", error);
    }
}


// ADD VIEW TO STORE...
exports.addViewToStore = async (req, res) => {
    try {
        const shop_id = req.params.shop_id;
        let shop = await Shop.findById(shop_id);

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        // Increment the view count
        const shop_views = shop.views;
        shop.views += 1;
        await shop.save();

        res.status(200).json({ success: true, message: `you viewed ${shop.name}`, shop_views });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add view to shop", error: error.message });
        console.log("Error adding view to shop: ", error);
    }
}


// UPDATE STORE AVAILABILITY...
exports.updateStoreAvailability = async (req, res) => {
    try {
        const shop_id = req.params.shop_id;
        const { days, time } = req.body;

        let shop = await Shop.findById(shop_id);

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        // Update shop availability
        if (days) shop.availability.days = days;
        if (time) shop.availability.time = time;

        await shop.save();

        res.status(200).json({ success: true, message: "Shop availability updated successfully", shop });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update shop availability", error: error.message });
        console.log("Error updating shop availability: ", error);
    }
};


// GET ALL SHOPS...
exports.getAllShops = async (req, res) => {
    try{
        const shops = await Shop.find();
        res.status(200).json({ shops });
    }catch(error){
        res.status(500).json({ success: false, message: "internal server error"});
        console.log("Error getting shops: ", error);
    }
};


// GET ALL TOP SELLING SHOPS...
/*
calculate shops with most sold products....
and return...
*/


// GET SHOPS BY USERS LOCATION....
/*
basically accepts a location and return stores
based on the provided location
*/

// GET POPULAR SHOPS....
/*
popular shops are shops with much followers...
probably with a threshold....
shops with followers > 10
*/

// BOOST STORE...






