const jwt = require('jsonwebtoken');

/**
 * Generate a short-lived access token (15 minutes)
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
};

/**
 * Generate a long-lived refresh token (7 days)
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
};

/**
 * Set JWT tokens as HttpOnly cookies on the response
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth/refresh', // Only sent to refresh endpoint
    });
};

/**
 * Clear JWT cookies (for logout)
 */
const clearTokenCookies = (res) => {
    res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0), path: '/api/v1/auth/refresh' });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    setTokenCookies,
    clearTokenCookies,
};
