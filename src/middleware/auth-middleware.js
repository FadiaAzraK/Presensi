const jwt = require('jsonwebtoken');
const secretToken = 'ssecretPresenceToken';
const { blacklistedTokens } = require('../controller/UserController');

const authenticateJWT = (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        return res.status(401).json({
            status: 'error',
            code: 401,
            message: 'Unauthorized: No token provided'
        });
    }

    const token = authorizationHeader.split(' ')[1];

    if (blacklistedTokens.has(token)) {
        return res.status(401).json({ status: 'false', code: 401, message: 'Unauthorized: Token has been invalidated' });
    }

    jwt.verify(token, secretToken, (err, user) => {
        if (err) {
            return res.status(403).json({
                status: 'error',
                code: 403,
                message: 'Unauthorized: Invalid token',
                error: err.message
            });
        }
        
        req.user = user;
        next();
    });
};

module.exports = authenticateJWT;