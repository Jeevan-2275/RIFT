import crypto from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/apiError.js';
import { successResponse } from '../utils/apiResponse.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenHelper.js';

/**
 * Register User
 * @route POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new ApiError(400, 'User already registered with this email address');
    }

    // Create user. Pre-save hook hashes passwordHash
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: role || 'developer',
    });

    // Generate tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    return successResponse(res, 201, 'User registered successfully', {
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login User
 * @route POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select passwordHash field
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    return successResponse(res, 200, 'Login successful', {
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout User
 * @route POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    return successResponse(res, 200, 'Logged out successfully', {});
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Tokens
 * @route POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new ApiError(403, 'Invalid or expired refresh token');
    }

    // Check if user exists and token matches
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(403, 'Invalid refresh token session');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user._id });

    // Update refresh token in db
    user.refreshToken = newRefreshToken;
    await user.save();

    return successResponse(res, 200, 'Token refreshed successfully', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'No user found with that email address');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set reset fields
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expiration to 10 minutes from now
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    return successResponse(res, 200, 'Password reset token generated successfully', {
      resetToken,
      info: 'Normally emailed, provided here for testing. Use this token to reset password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password
 * @route PUT /api/auth/reset-password/:resetToken
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;

    // Hash verification token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with matching token and valid expiry date
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired password reset token');
    }

    // Set new password (pre-save hashes passwordHash)
    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshToken = undefined; // Force logout other sessions
    await user.save();

    return successResponse(res, 200, 'Password reset successfully', {});
  } catch (error) {
    next(error);
  }
};

/**
 * Change Password (Authenticated)
 * @route PUT /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new ApiError(400, 'Incorrect old password');
    }

    // Update password (pre-save hashes passwordHash)
    user.passwordHash = newPassword;
    user.refreshToken = undefined; // Logout other devices
    await user.save();

    return successResponse(res, 200, 'Password updated successfully', {});
  } catch (error) {
    next(error);
  }
};

/**
 * Get User Profile
 * @route GET /api/auth/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    return successResponse(res, 200, 'Profile fetched successfully', {
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};
