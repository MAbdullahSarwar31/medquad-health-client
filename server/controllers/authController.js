const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
    generateAccessToken,
    generateRefreshToken,
    setTokenCookies,
    clearTokenCookies,
} = require('../utils/jwt');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists',
            });
        }

        // Only admins can create admin/employee accounts
        const allowedRoles = ['public', 'client'];
        const assignedRole = allowedRoles.includes(role) ? role : 'public';

        const user = await User.create({
            name,
            email,
            password,
            role: assignedRole,
            phone: phone || '',
        });

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token to user record
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Set cookies
        setTokenCookies(res, accessToken, refreshToken);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user: user.toJSON(),
                accessToken, // Also send in body for API clients
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Find user with password field included
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated. Contact an administrator.',
            });
        }

        // Verify password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token and update last login
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        setTokenCookies(res, accessToken, refreshToken);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout user (clear cookies)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
    try {
        // Clear refresh token from database
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
        }

        clearTokenCookies(res);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires valid refresh token cookie)
 */
const refreshAccessToken = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided',
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        // Find user and validate stored refresh token
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account deactivated',
            });
        }

        // Generate new tokens (rotate refresh token for security)
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        setTokenCookies(res, newAccessToken, newRefreshToken);

        res.status(200).json({
            success: true,
            data: {
                accessToken: newAccessToken,
            },
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired — please login again',
            });
        }
        next(error);
    }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('clientId', 'orgName');
        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, logout, refreshAccessToken, getMe };
