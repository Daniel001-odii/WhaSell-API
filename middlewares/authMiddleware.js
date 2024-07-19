const jwt = require('jsonwebtoken');

// auth middleware for tokens in headers
const protectOld = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};


// auth middleware for tokens in cookies...
const protect = (req, res, next) => {
    const token = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken){
        return res.status(500).json({ message: 'unauthorized' });
    }
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = { protect };
