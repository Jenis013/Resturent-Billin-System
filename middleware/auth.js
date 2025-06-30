// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('Authorization');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        jwt.verify(token, 'yourSecretKey', (error, decoded) => {
            if (error) {
                return res.status(401).json({ msg: 'Token is not valid' });
            } else {
                req.user = decoded.user;
                console.log("Auth Middleware - Decoded User:", decoded.user); // DEBUG
                next();
            }
        });
    } catch (err) {
        console.error('something wrong with auth middleware');
        res.status(401).json({ msg: 'Server Error' });
    }
};