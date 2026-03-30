const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' }
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: { message: 'Too many requests from this IP, please try again after a minute.' }
});

module.exports = { authLimiter, apiLimiter };
