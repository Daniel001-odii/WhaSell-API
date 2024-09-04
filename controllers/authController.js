const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Shop = require('../models/shopModel');

const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
};


const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};


// res.cookie('accessToken', accessToken, { httpOnly: false, maxAge: 15 * 60 * 1000 });
// res.cookie('refreshToken', refreshToken, { httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

const setAuthCookies = (res, access_token, refresh_token) => {
    res.setHeader('Set-Cookie', [
        `accessToken=${access_token}; HttpOnly; Secure; SameSite=none; Max-Age=${7 * 24 * 60 * 60}`,
        `refreshToken=${refresh_token}; HttpOnly; Secure; SameSite=none; Max-Age=${30 * 24 * 60 * 60 * 1000}`
    ]);

    // res.cookie('accessToken', access_token, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    // res.cookie('refreshToken', refresh_token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

}

exports.register = async (req, res) => {
    const { username, password, email, phone } = req.body;
    try {
        const user = new User({ email, username, password, phone });

        // check if phone is already registered...
        const phoneAvailable = await User.findOne({ phone });

        /*
        if(phoneAvailable){
            return res.status(400).json({ message: "sorry this number is already registered!"})
        }
            */

        // await user.save();

        // generate auth tokens and save to cookies to sign-in ...

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save();

        // save tokens to cookies
        setAuthCookies(res, accessToken, refreshToken);


        res.status(201).json({ message: 'User registered and logged-in successfully' });

    } catch (error) {
        console.log("error registering user: ", error);
        res.status(500).json({ message: 'Error registering user', error });
    }
};

exports.registerSeller = async (req, res) => {
    const { username, password, email, phone, shop_name, shop_category, shop_description } = req.body;
    try {
        const user = new User({ 
            email, 
            username, 
            password, 
            phone,
            account_type: 'seller', 
        });

        // auto create new shop for user...
        const shop = new Shop({
            name: shop_name,
            description: shop_description,
            category: shop_category,
            owner: user._id,
        });
        await shop.save();

        // check if phone is already registered...
        const phoneAvailable = await User.findOne({ phone });

        /*
        if(phoneAvailable){
            return res.status(400).json({ message: "sorry this number is already registered!"})
        }
            */

        // await user.save();

        // generate auth tokens and save to cookies to sign-in ...

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        // save tokens to cookies
        setAuthCookies(res, accessToken, refreshToken);

        res.status(201).json({ message: 'User registered and logged-in successfully' });

    } catch (error) {
        console.log("error registering user: ", error);
        res.status(500).json({ message: 'Error registering user', error });
    }
};


exports.login = async (req, res) => {
    const { usernameOrEmailOrPhone, password } = req.body;
    try {
        // Find user by either username, email, or phone
        const user = await User.findOne({
            $or: [
                { username: usernameOrEmailOrPhone },
                { email: usernameOrEmailOrPhone },
                { phone: usernameOrEmailOrPhone }
            ]
        });

        // Check if user exists and password is correct
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save();


        // set access and refresh token to cookies...
        setAuthCookies(res, accessToken, refreshToken);

        // Respond with success message
        res.json({ message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
        console.log("error in login: ", error)
    }
};



exports.token = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(403).json({ message: 'Refresh token required' });
    }
    try {
        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }
            const accessToken = generateAccessToken(user);

            // set access..
            res.cookie('accessToken', accessToken, { 
                httpOnly: true, 
                secure: true, 
                sameSite: 'none',
                maxAge: 15 * 60 * 1000 
            });
            res.status(200).json({ message: 'your session has been restored', accessToken });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error refreshing token', error });
    }
};

exports.checkCurrentUser = async (req, res) => {
    try{
        
    }catch(error){
        res.status(500).json({ message: "internal server error"});
    }
}


exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    try {
        const user = await User.findOne({ refreshToken });
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
        res.setHeader('Set-Cookie', [
            `accessToken=; HttpOnly; Secure; SameSite=none; Max-Age=0`,
            `refreshToken=; HttpOnly; Secure; SameSite=none; Max-Age=0`
        ]);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out', error });
    }
};