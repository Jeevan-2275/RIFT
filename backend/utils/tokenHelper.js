import jwt from 'jsonwebtoken';

/**
 * Generate Access Token
 * @param {Object} payload 
 * @returns {String} Token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

/**
 * Generate Refresh Token
 * @param {Object} payload 
 * @returns {String} Token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

/**
 * Verify Access Token
 * @param {String} token 
 * @returns {Object} Decoded payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify Refresh Token
 * @param {String} token 
 * @returns {Object} Decoded payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
