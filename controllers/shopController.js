
// CREATE
// READ
// UPDATE
// DELETE CONTROLLERs HERE
const Shop = require("../models/shopModel");
const Invoice = require("../models/invoiceModel")
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel")

const { shopImageUpload } = require("../utils/uploadConfig");

const { initializeFormidable } = require('../config/formidable.config');
const { uploadShopProfileImage } = require('../utils/firebaseFileUpload');


const getFullUrl = require('../utils/getFullPath');
const shopModel = require("../models/shopModel");

const nearbyStates = require('../utils/statesAndNeighbors.js');
const glipModel = require("../models/glipModel.js");
const userModel = require("../models/userModel");

// Controller to change shop profile image
/* exports.changeShopImage = async (req, res) => {
    try {
        const imagePath = req.file.path;
        const imageFullUrl = getFullUrl(req, imagePath);
  
        shop.profile.image_url = imageFullUrl;
        await shop.save();
  
        res.status(201).json({ message: "Shop image changed successfully!", imageFullUrl });
    } catch (error) {
      console.log("Shop image upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
};
 */
exports.changeShopImage = async (req, res) => {
    const form = initializeFormidable();
    const shop_id = req.params.shop_id;
    const shop = await Shop.findById(shop_id);

    form.parse(req, async (err, fields, files) => {
     if(err){
       return res.status(500).json({ message: "error uploading images", err});
     };
 
     const file = files['shop_image'][0];
     const result = await uploadShopProfileImage(file);
 
     if(result.success) {
        shop.profile.image_url = result.url;
        await shop.save();

    //    res.status(200).json({result});
       res.status(200).json({ message: "shop photo changed successfully!"});
     } else {
       res.status(500).json(result);
     }
 
    })
 };

// CREATE A NEW SHOP...
exports.createNewShop = async (req, res) => {
    try {
        // get shop name and description via request body
        const { name, description, category } = req.body;
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
            category,
        });

        

        // save shop to userDb...
        const user = await User.findById(owner);
        user.shop = shop;

        // change user account type to seller...
        user.account_type = "seller";
        await user.save();

        shop.profile.location = user.location;

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
    try {
        // Convert the shop_name parameter to lowercase
        const name = req.params.shop_name.toLowerCase();

        // Find the shop by name (ensure name is stored in lowercase in the database)
        const shop = await Shop.findOne({ name: name }).populate("owner");
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
        const shop = await Shop.findById(shop_id).populate("owner profile");

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

         // check if store name already exists..
         const exisitngShop = await Shop.findOne({ name });

         // check is shop with name already exists
         if(exisitngShop && exisitngShop.owner != req.user){
             return res.status(400).json({ success: false, message: `sorry shop name already exists`})
         }

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        // Update shop details
        // if (name) shop.name = name;
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

        const user = await userModel.findById(user_id);

        let shop = await Shop.findById(shop_id);

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        };

        // Check if the user is already following the shop
        const userIndex = shop.followers.findIndex(follower => follower._id.toString() === user_id.toString());
        if (userIndex > -1) {
            shop.followers.splice(userIndex, 1);
            await shop.save();

            user.followed_shops.splice(user.followed_shops.indexOf(shop_id), 1)
            await user.save();
            return res.status(200).json({ success: true, message: "You unfollowed this shop" });
        } else {
            shop.followers.push(user_id);
            await shop.save();

            user.followed_shops.push(shop_id)
            await user.save();
            return res.status(201).json({ success: false, message: "You are now following this shop" });
        }

        // also dont allow shop owners to follow their own store...
        if(shop.owner == user_id){
            return res.status(400).json({ success: false, message: "sorry, you cant follow your own shop" });
        }

        // Add user to shop's followers
       /*  shop.followers.push(user_id);
        await shop.save();
 */
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

        let shop_views = shop.views;

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        };


        let viewed_shops = req.cookies.viewed_shops;

        if(!viewed_shops){
            viewed_shops = [];
        } else {
            viewed_shops = JSON.parse(viewed_shops);
        };
        if(!viewed_shops.includes(shop_id)){
            // Increment the view count
           
            shop.views += 1;
            await shop.save();

            viewed_shops.push(shop_id);

            // Update the 'viewed_products' cookie with the new array
            res.cookie('viewed_shops', JSON.stringify(viewed_shops), {
                maxAge: 30 * 24 * 60 * 60 * 1000, // Cookie expires in 30 days
                httpOnly: true // Makes the cookie inaccessible to JavaScript in the browser (optional, for security)
            });
        }


       

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

/* exports.getShopsAnalytics = async (req, res) => {
    try {
        const user_id = req.user;
        const shop = await shopModel.findOne(
            { owner: user_id }, 
            "views followers sold_products best_selling_product"
        );

        if (!shop) {
            return res.status(404).json({ message: "Couldn't find shop!" });
        }

        const followers_count = shop.followers.length;
        let best_selling_product = shop.best_selling_product;
        if (!best_selling_product) {
            shop.best_selling_product = "No data available";
        }

        // Group followers by month and count them
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const followersByMonth = {};

        shop.followers.forEach(follower => {
            const month = follower.date.getMonth();  // Get month as an index (0 = January)
            const monthName = monthNames[month];
            followersByMonth[monthName] = (followersByMonth[monthName] || 0) + 1;
        });

        // Prepare chart_data
        const labels = Object.keys(followersByMonth);
        const data = Object.values(followersByMonth);
        const bgColor = labels.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`);

        const chart_data = {
            labels: labels,
            datasets: [{
                backgroundColor: bgColor,
                data: data
            }]
        };

        res.status(200).json({ shop, followers_count, chart_data });

    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
        console.log("Error getting shops: ", error);
    }
}; */

exports.getShopsAnalytics = async (req, res) => {
    try {
        const user_id = req.user;
        const shop = await shopModel.findOne(
            { owner: user_id }, 
            "views followers sold_products best_selling_product"
        );

        if (!shop) {
            return res.status(404).json({ message: "Couldn't find shop!" });
        }

        const followers_count = shop.followers.length;
        let best_selling_product = shop.best_selling_product;
        if (!best_selling_product) {
            shop.best_selling_product = "No data available";
        }

        // Initialize all months with 0 followers
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const followersByMonth = monthNames.reduce((acc, month) => {
            acc[month] = 0;
            return acc;
        }, {});

        // Count followers for each month
        shop.followers.forEach(follower => {
            const month = follower.date.getMonth();  // Get month as an index (0 = January)
            const monthName = monthNames[month];
            followersByMonth[monthName] += 1;
        });

        // Prepare chart_data
        const labels = monthNames;  // Ensure all months are included
        const data = labels.map(month => followersByMonth[month]);
        
        // const bgColor = labels.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`);
        const bgColor = labels.map(() => "#47c68f");

        const chart_data = {
            labels: labels,
            datasets: [{
                backgroundColor: bgColor,
                data: data
            }]
        };

        res.status(200).json({ shop, followers_count, chart_data });

    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
        console.log("Error getting shops: ", error);
    }
};


exports.getShopsInNearByStates = async (req, res) => {
    try {
        const user_state = req.params.user_state.split(" ")[0];

        console.log("from client: ", user_state);

        // Check if the user_state is provided
        if (!user_state) {
            return res.status(400).json({ message: "Please provide a valid user state" });
        }

        // Find the user's state object and its neighbors
        const state_object = nearbyStates.find(state => state.state.toLowerCase() === user_state.toLowerCase());

        if (!state_object) {
            return res.status(404).json({ message: "State not found" });
        }

        // If state_object is found, proceed with fetching shops in neighboring states
        console.log("States near you: ", state_object.neighbors);

        // Function to fetch shops in neighboring states
        const getShopsInNearbyStates = async () => {
            const shops_near_me = [];

            // Normalize user_state to match by first word only (e.g., "Lagos" in "Lagos State")
            const normalized_user_state = user_state.split(' ')[0].toLowerCase();

            // First, find shops in the user's state using a regex to match by the first word
            const shops_in_user_state = await shopModel.find({
                'profile.location.state': { $regex: `^${normalized_user_state}`, $options: 'i' }
            });
            shops_near_me.push(...shops_in_user_state);

            // Now find shops in neighboring states
            for (const neighbor of state_object.neighbors) {
                // Normalize the neighbor state name in the same way
                const normalized_neighbor_state = neighbor.split(' ')[0].toLowerCase();

                const shops_in_neighbor_state = await shopModel.find({
                    'profile.location.state': { $regex: `^${normalized_neighbor_state}`, $options: 'i' }
                });
                shops_near_me.push(...shops_in_neighbor_state);
            }

            return shops_near_me;
        };

        // Await the result from getShopsInNearbyStates function
        const shops_near_me = await getShopsInNearbyStates();

        console.log("Shops near you: ", shops_near_me);

        return res.status(200).json({ nearby_stores: shops_near_me });

    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).json({ message: "Failed to get nearby shops" });
    }
};


// get glips from followed shops...
exports.getGlipsByFollowedShops = async (req, res) => {
    try{
        const user_id = req.user;
        const user = await userModel.findById(user_id);

        const followed_shops = await shopModel.find({ _id: { $in: user.followed_shops }});
        
        const glips = await glipModel.find({ shop: { $in: user.followed_shops }});

        res.status(200).json({ glips, followed_shops });
       
 
    }catch(error){
        res.status(500).json({ message: "error getting glips from followed shops"});
    }
}


/* 
    check if shop name already exists..
*/
exports.checkExistingShopName = async (req, res) => {
    try{
        const name = req.params.shop_name;
        const exisitngShop = await Shop.findOne({ name });
        if(exisitngShop){
            return res.status(400).json({ message: "Sorry shop name already exist"})
        }
        res.status(200).json({ message: "shop name accepted"});
    }catch(error){
        res.status(500).json({ message: "error checking for shop name" });
    }
};

// BOOST STORE...


// GET ALL TOP SELLING SHOPS...
/*
calculate shops with most sold products....
and return...
*/


// GET SHOPS NEAR USERS LOCATION....
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

// GET BOOSTED SHOPS....
/*

*/
exports.getBoostedShops = async (req, res) => {
    try{
        const shops = await shopModel.find({ is_boosted: true });
        res.status(200).json({ shops });
    }catch(error){
        res.status(500).json({ message: "failed to get all boosted shops"})
    }
}








