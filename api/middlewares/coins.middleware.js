
const walletModel = require("../models/walletModel");


// auth middleware for tokens in cookies...
const checkcoins = async (req, res, next) => {
    try {
        // const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user_id = req.user;
        const wallet = await walletModel.findOne({ user: user_id });

        if(!wallet){
            console.log("no wallet found!")
            return
        } 
        const user_balance = wallet.credit_balance;

        // check for low coin balance...
        if(user_balance == 0){
            console.log("cannot proceed with action, you have insufficient coins balance, please top-up!");
            return res.status(400).json({ message: "insufficient coin balance, please top-up!"})
        }

        next();
    } catch (error) {
        res.status(401).json({ message: 'error checking coin balance' });
        console.log("error checking coin balance");
    }
};

module.exports = { checkcoins };
