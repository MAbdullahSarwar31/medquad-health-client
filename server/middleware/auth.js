const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — Verify JWT access token from HttpOnly cookie
 * Attaches decoded user to req.user
 */
const protect = async (req, res, next) => {
    try {
        let token = req.cookies.accessToken;

        // Also check Authorization header as fallback (for API clients)
        if (!token && req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized — no token provided',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB (without password)
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized — user not found or deactivated',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired — please refresh',
                code: 'TOKEN_EXPIRED',
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Not authorized — invalid token',
        });
    }
};

/**
 * Require specific role(s) — must be used AFTER protect middleware
 * Usage: requireRole('admin') or requireRole('admin', 'employee')
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied — requires role: ${roles.join(' or ')}`,
            });
        }

        next();
    };
};

/**
 * Optional Auth — Decodes token if present but doesn't block if missing
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies.accessToken;

        if (!token && req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user && user.isActive) {
            req.user = user;
        }
        
        next();
    } catch (error) {
        // If token is invalid or expired, just proceed without setting req.user
        next();
    }
};

module.exports = { protect, requireRole, optionalAuth };
