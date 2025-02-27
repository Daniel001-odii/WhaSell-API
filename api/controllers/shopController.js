
// CREATE
// READ
// UPDATE
// DELETE CONTROLLERs HERE
const Shop = require("../models/shopModel.js");
const Invoice = require("../models/invoiceModel.js")
const Product = require("../models/productModel.js");
const User = require("../models/userModel.js");
const Notification = require("../models/notificationModel.js")

const { shopImageUpload } = require("../utils/uploadConfig.js");

const { initializeFormidable } = require('../config/formidable.config.js');
const { uploadShopProfileImage } = require('../utils/firebaseFileUpload.js');


const getFullUrl = require('../utils/getFullPath.js');
const shopModel = require("../models/shopModel.js");

const nearbyStates = require('../utils/statesAndNeighbors.js');
const glipModel = require("../models/glipModel.js");
const userModel = require("../models/userModel.js");
const cron = require('node-cron');
const Wallet = require('../models/walletModel.js'); // Assuming you have a Wallet model
const BoostedShop = require("../models/boostedShopModel.js");
const { default: mongoose } = require("mongoose");

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
        if(!name || !description || !category){
            return res.status(400).json({ message: "all fields are required to create shop"})
        }
        
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

// GET A SHOP BY ITS USer
// GET A SHOP BY ITS USER
exports.getUserShop = async (req, res) => {
    try {
        const user = req.userModel; // Ensure this contains user info

        console.log("user: ", user)
    
        if (!user || !user._id) {
            return res.status(400).json({ success: false, message: "User authentication required." });
        }

        // Find the shop by owner ID
        const shop = await Shop.findOne({ owner: user._id }).populate("owner");

        console.log("shop: ", shop)

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found for this user." });
        }

        // Convert shop document to plain object before modifying
        let shopData = shop.toObject();

        // Find all products belonging to the shop
        const products = await Product.find({ shop: shop._id });
        shopData.products = products;
        shopData.listings = products.length;
        
        // Followers count
        shopData.followers_count = shop.followers.length;

        res.status(200).json({ success: true, shop: shopData });
    } catch (error) {
        console.error("Error getting shop: ", error);
        res.status(500).json({ success: false, message: "Failed to get shop", error: error.message });
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
        const shop_id = req.params.shop_id;
        let shop = await Shop.findById(shop_id);

        const {
            name,
            description,
            category,
            image
        } = req.body.shop;

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
       shop.profile.image_url = image ? image :  shop.profile.image_url;
        

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
        // res.status(200).json({ success: true, message: "You are now following the shop", shop });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to follow shop", error: error.message });
        console.log("Error following shop: ", error);
    }
}


// ADD VIEW TO STORE...
exports.addViewToStore = async (req, res) => {
    try {
        const shop_name = req.params.shop_name.toLowerCase();
        let shop = await Shop.findOne({ name: shop_name })

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
        if(!viewed_shops.includes(shop._id)){
            // Increment the view count
           
            shop.views += 1;
            await shop.save();

            viewed_shops.push(shop._id);

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
/* exports.getAllShops = async (req, res) => {
    try{
        const shops = await Shop.find().populate("owner");
        res.status(200).json({ shops });
    }catch(error){
        res.status(500).json({ success: false, message: "internal server error"});
        console.log("Error getting shops: ", error);
    }
}; */

exports.getAllShops = async (req, res) => {
    try {
        // Fetch all shops
        const shops = await Shop.find().populate("owner");

        // Fetch the most recent product for each shop with its first image
        const shopHeaderImages = await Product.aggregate([
            {
                $match: { images: { $exists: true, $ne: [] } } // Ensure products have images
            },
            {
                $sort: { createdAt: -1 } // Sort products by most recent first
            },
            {
                $group: {
                    _id: "$shop", // Group by shop ID
                    firstImage: { $first: "$images" } // Take the first image from the most recent product
                }
            }
        ]);

        // Map shops to include the headerImage
        const shopsWithHeaderImages = shops.map(shop => {
            const headerImageEntry = shopHeaderImages.find(entry => String(entry._id) === String(shop._id));
            return {
                ...shop.toObject(),
                headerImage: headerImageEntry ? headerImageEntry.firstImage : null
            };
        });

        res.status(200).json({ shops: shopsWithHeaderImages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
        console.log("Error getting shops: ", error);
    }
};


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
        // const user_state = "Abia";

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
             // Fetch the most recent product for each shop with its first image [NEW]
            const shopHeaderImages = await Product.aggregate([
                {
                    $match: { images: { $exists: true, $ne: [] } } // Ensure products have images
                },
                {
                    $sort: { createdAt: -1 } // Sort products by most recent first
                },
                {
                    $group: {
                        _id: "$shop", // Group by shop ID
                        firstImage: { $first: "$images" } // Take the first image from the most recent product
                    }
                }
            ]);

            // Map shops to include the headerImage [NEW]
            const shopsWithHeaderImages = shops_in_user_state.map(shop => {
                const headerImageEntry = shopHeaderImages.find(entry => String(entry._id) === String(shop._id));
                return {
                    ...shop.toObject(),
                    headerImage: headerImageEntry ? headerImageEntry.firstImage : null
                };
            });

            // shops_near_me.push(...shops_in_user_state);
            shops_near_me.push(...shopsWithHeaderImages);

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
        let shops_near_me = await getShopsInNearbyStates();

        if(shops_near_me.length == 0 || '' || null){
            const alt = await shopModel.find()
            shops_near_me = alt
        }

        console.log("Shops near you: ", shops_near_me);

        return res.status(200).json({ nearby_stores: shops_near_me });

    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).json({ message: "Failed to get nearby shops" });
    }
};


// get glips from followed shops...
/* exports.getGlipsByFollowedShops = async (req, res) => {
    try{
        const user_id = req.user;
        const user = await userModel.findById(user_id);

        const followed_shops = await shopModel.find({ _id: { $in: user.followed_shops }});

        const shopHeaderImages = await Product.aggregate([
            {
                $match: { images: { $exists: true, $ne: [] } } // Ensure products have images
            },
            {
                $sort: { createdAt: -1 } // Sort products by most recent first
            },
            {
                $group: {
                    _id: "$shop", // Group by shop ID
                    firstImage: { $first: "$images" } // Take the first image from the most recent product
                }
            }
        ]);

        // Map shops to include the headerImage [NEW]
        const shops = followed_shops.map(shop => {
            const headerImageEntry = shopHeaderImages.find(entry => String(entry._id) === String(shop._id));
            return {
                ...shop.toObject(),
                headerImage: headerImageEntry ? headerImageEntry.firstImage : null
            };
        });
        
        const glips = await glipModel.find({ shop: { $in: user.followed_shops }}).populate("shop name");

        res.status(200).json({ glips, followed_shops, shops });
       
 
    }catch(error){
        res.status(500).json({ message: "error getting glips from followed shops"});
    }
};
 */


exports.getAllGlips = async (req, res) => {
    try {
        const glips = await glipModel.find().populate("shop name");
        res.status(200).json({ glips });
    } catch (error) {
        res.status(500).json({ message: "Failed to get all glips", error: error.message });
        console.log("Error getting all glips: ", error);
    }
};





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
        // const shops = await BoostedShop.find().populate('shop');
        const shops = await shopModel.find({ is_boosted: true });
        res.status(200).json({ shops });
    }catch(error){
        res.status(500).json({ message: "failed to get all boosted shops"})
    }
}

/* 
    boost shop
*/
exports.boostShop = async (req, res) => {
    try {
        const shop_id = req.userModel.shop;
        const { duration } = req.body;
        
        const all_boosted_shops = await BoostedShop.countDocuments();
        if(all_boosted_shops == 4){
            return res.status(400).json({ message: "sorry shop boosting slots filled, try again later!" });
        }

        // Check if the shop exists
        const shop = await Shop.findById(shop_id);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        const owner = await User.findById(shop.owner);
        const wallet = await Wallet.findOne({ user: owner._id });

        // Check if the shop is already boosted
        const existingBoost = await BoostedShop.findOne({ shop: shop_id });
        if (existingBoost) {
            // Remove the boost
            await BoostedShop.deleteOne({ shop: shop_id });
            shop.is_boosted = false;
            await shop.save();
            console.log('shop boost removed')
            return res.status(200).json({ message: "Shop boosting cancled boosted" });
            
        }


        if(wallet.balance < (duration * 10)){
            return res.status(400).json({ message: "insufficient coins for shop boost"});
        }

     


        if(duration){
            // Create a new boosted shop entry
            const boostedShop = new BoostedShop({
                shop: shop_id,
                duration: new Date(Date.now() + duration * 24 * 60 * 60 * 1000) // duration in days
            });

            shop.is_boosted = true;
            await shop.save();

            await boostedShop.save();

            return res.status(201).json({ message: "Shop boosted successfully", boostedShop });
        }
        
    } catch (error) {
        res.status(500).json({ message: "Failed to boost shop", error: error.message });
        console.log("Error boosting shop: ", error);
    }
};

/* 
    cancel shop boost
*/
exports.cancelShopBoost = async (req, res) => {
    try {
        const shop_id = req.userModel.shop;

        // Check if the shop exists
        const shop = await Shop.findById(shop_id);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        // Check if the shop is boosted
        const boostedShop = await BoostedShop.findOne({ shop: shop_id });
        if (!boostedShop) {
            return res.status(400).json({ message: "Shop is not boosted" });
        }

        // Remove the boost
        await BoostedShop.deleteOne({ shop: shop_id });
        shop.is_boosted = false;
        await shop.save();

        res.status(200).json({ message: "Shop boost canceled successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to cancel shop boost", error: error.message });
        console.log("Error canceling shop boost: ", error);
    }
};

// no_of_days
// shop_name
// Schedule a cron job to run every day at midnight




/* 
    THIS CRON JOB BELOW IS TO AUTO DEDUCT CREDITS FROM BOOSTED SHOP OWNERS WALLET
    EVERYDAY AT MIDNIGHT
    COIN DEDUCTION AMOUNT IS 10 CREDITS
*/
//14 SECS CRON JOB
// cron.schedule('*/30 * * * * *', async () => {
cron.schedule('0 0 * * *', async () => {
    try {
        const boostedShops = await BoostedShop.find();

        for (const boostedShop of boostedShops) {
            const shop = await Shop.findById(boostedShop.shop);
            const owner = await User.findById(shop.owner);
            const wallet = await Wallet.findOne({ user: owner._id });

            if (wallet && wallet.balance >= 10) {
                wallet.balance -= 10;
                // add to transactions..
                const today = new Date();
                wallet.debit_transactions.push({
                  date: today,
                  coin_amount: 10,
                  narration: 'debit for shop boosting'
                });

                await wallet.save();
                console.log(`Deducted 10 credits from ${owner.username}'s wallet for shop ${shop.name}`);
            } else {
                console.log(`Insufficient balance for ${owner.username}'s wallet`);
                // Optionally, you can disable the boost if the balance is insufficient
                shop.is_boosted = false;
                await shop.save();
            }

            // Check if the boost duration has expired
            if (new Date() >= boostedShop.duration) {
                shop.is_boosted = false;
                await shop.save();
                await BoostedShop.deleteOne({ _id: boostedShop._id });
                console.log(`Boost period ended for shop ${shop.name}`);
            }
        }
    } catch (error) {
        console.error('Error running cron job:', error);
    }
});








