const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Shop = require('../models/shopModel');
const sendEmail = require('../utils/sendEmail');
const walletModel = require('../models/walletModel');

const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });
};


const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
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


const addRefferalBonus = async (refferal_code, username) => {
    try{
        const refferal_bonus = 10;
        const refferal_user = await User.findOne({ refferal_code });
        const wallet = await walletModel.findOne({ user: refferal_user._id });

        console.log("found owner wallet: ", wallet);
        
        const email = refferal_user.email;

        if(refferal_user){
            wallet.balance = Number(wallet.balance) + Number(refferal_bonus);
            wallet.transactions.push(
                {
                    status: 'successful',
                    amount: refferal_bonus,
                    date: new Date(),
                    narration: 'Refferal Bonus',
                }
            );
            await wallet.save();

            // send email to refferal user...
            const mail_options = {
                emailTo: email,
                subject: "Yes you did it, welcome onboard!",
                html: `
                    <html>
                        <body>
                            <h1>GOOD JOB - YOU REFFERED ${username.toUpperCase()}</h1>
                        </body>
                    </html>
                `
            };

        await sendEmail(mail_options);
    }
    }catch(error){
        throw error
    }
    
};


const EMAIL_HEADER_SECTION = `
    <tr>
      <td style="text-align: center; padding: 20px; overflow: hidden; height: 100px; background: url('https://raw.githubusercontent.com/Daniel001-odii/WhaSell/refs/heads/main/src/assets/images/whatsell_email_header.png'); 
      background-position: center;
      background-size: contain;">
      </td>
    </tr>
`;

const EMAIL_FOOTER_SECTION = `
    <tr>
        <td style="padding: 20px">
            <p>Thank you for using WhatSell!<br/>
                Best regards,<br/>
                The WhatSell Team.
            </p>
        </td>
    </tr>
    <tr>
      <td style="background-color: #f4f4f4; text-align: center; padding: 10px; font-size: 12px; color: #666666;">
        <p style="margin: 0 0 10px;">Follow us on:</p>
        <div style="margin: 0 0 10px;">
          <a href="https://facebook.com" target="_blank" style="margin: 0 10px; color: #666666; font-size: 16px; text-decoration: none;">Facebook</a> |
          <a href="https://twitter.com" target="_blank" style="margin: 0 10px; color: #666666; font-size: 16px; text-decoration: none;">Twitter</a> |
          <a href="https://instagram.com" target="_blank" style="margin: 0 10px; color: #666666; font-size: 16px; text-decoration: none;">Instagram</a>
        </div>
        <p style="margin: 0;">&copy; 2025 WhatSell. All rights reserved.</p>
      </td>
    </tr>
`
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

        const username = user.username;

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

        const mail_options = {
            emailTo: user.email,
            subject: "Login Alert",
            html: `
                  <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
  <table style="border-spacing: 0; width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header Section -->
    ${EMAIL_HEADER_SECTION}

    <!-- Body Content -->
    <tr>
      <td style="padding: 20px;">
        <p style="margin: 0 0 20px;">Hi ${username},</p>
        <p style="margin: 0 0 20px;">We noticed a login to your WhatSell account</p>
        <p style="margin: 0 0 20px;">If this was you, no further action is needed. If you didn’t log in, please reset your password immediately or contact our support team.</p>
      </td>
    </tr>

    <!-- Footer Section -->
    ${EMAIL_FOOTER_SECTION}

  </table>
</body>
</html>
            `
        };

        await sendEmail(mail_options);

        // Respond with success message
        res.json({ message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
        console.log("error in login: ", error)
    }
};

exports.register = async (req, res) => {
    const { refferal_code, username, password, email, phone } = req.body;
    console.log("refferal code: ", refferal_code);
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

        const mail_options = {
            emailTo: email,
            subject: "Yes you did it, welcome onboard!",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
                <table style="border-spacing: 0; width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header Section -->
                    ${EMAIL_HEADER_SECTION}

                    <!-- Body Content -->
                    <tr>
                    <td style="padding: 20px;">
                        <h1 style="margin: 0 0 20px;">Hi ${username}!</h1>
                        <p style="margin: 0 0 20px;">Thank you for joining WhatSell, where modern e-commerce is redefined. We are thrilled to have you on board. Start exploring our features and find the best deals today!</p>
                        <p style="margin: 0;"><a href="#" style="color: #007BFF; text-decoration: none;">Visit Our Website</a></p>
                    </td>
                    </tr>

                    <!-- Footer Section -->
                    ${EMAIL_FOOTER_SECTION}
                </table>
                </body>
                </html>
            `
        };

        await sendEmail(mail_options);

        /* 
            award refferal bonus to user...
        */
         if(refferal_code){
            /* 
                util function to award refferal bonus to user...
            */
           await addRefferalBonus(refferal_code, username);
         }


        res.status(201).json({ message: 'User registered and logged-in successfully' });

    } catch (error) {
        console.log("error registering user: ", error);
        res.status(500).json({ message: 'Error registering user', error });
    }
};

exports.registerSeller = async (req, res) => {
    const { refferal_code, username, password, email, phone, shop_name, shop_category, shop_description } = req.body;
    console.log("refferal code: ", refferal_code);
    try {
        const user = new User({ 
            email, 
            username, 
            password, 
            phone,
            account_type: 'seller', 
        });

        

        const exisitingShopName = await Shop.findOne({ name: shop_name });
        if(exisitingShopName){
            return res.status(400).json({ message: "sorry shop name already exist" });
        }

        // auto create new shop for user...
        const shop = new Shop({
            name: shop_name,
            description: shop_description,
            category: shop_category,
            owner: user._id,
        });

        // shop.profile.location = user.profile.location;
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


        
        const mail_options = {
            emailTo: email,
            subject: "WELCOME TO WHATSELL! 🎉",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
                <table style="border-spacing: 0; width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header Section -->
                    ${EMAIL_HEADER_SECTION}

                    <!-- Body Content -->
                    <tr>
                    <td style="padding: 20px;">
                        <h1 style="margin: 0 0 20px;">Welcome to WhatSell!</h1>
                        <p style="margin: 0 0 20px;">Thank you for joining WhatSell, where modern e-commerce is redefined. We are thrilled to have you on board. Start exploring our features and find the best deals today!</p>
                        <p style="margin: 0;"><a href="#" style="color: #007BFF; text-decoration: none;">Visit Our Website</a></p>
                    </td>
                    </tr>

                    <!-- Footer Section -->
                    ${EMAIL_FOOTER_SECTION}
                </table>
                </body>
                </html>
            `
        };

        await sendEmail(mail_options);

        /* 
            award refferal bonus to user...
        */
      

       if(refferal_code){
        /* 
            util function to award refferal bonus to user...
        */
            await addRefferalBonus(refferal_code, username);

       }
       



        res.status(201).json({ message: 'User registered and logged-in successfully' });

    } catch (error) {
        console.log("error registering user: ", error);
        res.status(500).json({ message: 'Error registering user', error });
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