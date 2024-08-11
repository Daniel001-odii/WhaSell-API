const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const user = require('../models/userModel');


const { profileImageUpload } = require("../utils/uploadConfig");
const getFullUrl = require('../utils/getFullPath');



// get details user by middleware
exports.getUserDetails = async (req, res) => {
    try{
        const user_id = req.user;
        const user = await User.findById(user_id).populate("shop");

        res.status(200).json({ user });
    }catch(error){
        console.log("error getting user detiails: ", error);
        res.status(500).json({ message: "internal server error" });
    }
}


exports.changeUserProfileImage = async (req, res) => {
    try {

        // console.log("from client: ", req);
        // if (!req.file) {
        //     return res.status(400).json({ message: 'No file uploaded.' });
        // }

      // Using multer middleware to handle file upload
      profileImageUpload.single('user_image')(req, res, async function (err) {
        if (err) {
          return res.status(400).json({ error: 'Image upload failed', err });
        }
  
        const user = req.userModel;

        console.log("found user: ", user)
  
        const imagePath = req.file.path;
        const imageFullUrl = getFullUrl(req, imagePath);
  
        user.profile.image_url = imageFullUrl;
        await user.save();
  
        res.status(201).json({ message: "profile image changed successfully!", imageFullUrl });
      });
    } catch (error) {
      console.log("user image upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const user_id = req.user;
        const { username, email, phone, location, socials } = req.body;

        // console.log("username from client: ", username);
        console.log("location from client: ", req.body);

        // Find the user by ID
        let user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        };

        // console.log("user from b-end: ", user)
        // Update user details
        user.username = username || user.username;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.location = location || user.location;
        user.profile.socials = socials || user.profile.socials;

        // Save updated user
        await user.save();

        res.status(200).json({ message: "Profile updated successfully" });
    }catch(error){
        console.log("error updating user: ", error)
        res.status(500).json({ message: "internal server error" });
    }
};