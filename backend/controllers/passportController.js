import Passport from '../models/Passport.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';

// Helper to generate QR code data URL
const generateQRCode = async (text) => {
  return await QRCode.toDataURL(text);
};

export const createPassport = async (req, res, next) => {
  try {
    const { agentName, agentType } = req.body;
    const ownerId = req.user.id;
    const privateKey = uuidv4(); // simplistic private key placeholder
    const privateKeyHash = await bcrypt.hash(privateKey, 10);
    const publicKey = uuidv4(); // placeholder public key
    const qrCodeData = await generateQRCode(publicKey);

    const passport = await Passport.create({
      ownerId,
      agentName,
      agentType,
      publicKey,
      privateKeyHash,
      qrCodeData,
    });

    // Return the private key once to the owner (never store plaintext)
    const data = { passport, privateKey };
    return successResponse(res, 201, 'Passport created', data);
  } catch (err) {
    next(err);
  }
};

export const getPassports = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const passports = await Passport.find({ ownerId });
    return successResponse(res, 200, 'Passports retrieved', passports);
  } catch (err) {
    next(err);
  }
};

export const getPassportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const passport = await Passport.findOne({ _id: id, ownerId: req.user.id });
    if (!passport) return next(new ApiError(404, 'Passport not found'));
    return successResponse(res, 200, 'Passport retrieved', passport);
  } catch (err) {
    next(err);
  }
};

export const updatePassport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const passport = await Passport.findOneAndUpdate({ _id: id, ownerId: req.user.id }, updates, { new: true });
    if (!passport) return next(new ApiError(404, 'Passport not found'));
    return successResponse(res, 200, 'Passport updated', passport);
  } catch (err) {
    next(err);
  }
};

export const deletePassport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const passport = await Passport.findOneAndUpdate(
      { _id: id, ownerId: req.user.id },
      { status: 'revoked' },
      { new: true }
    );
    if (!passport) return next(new ApiError(404, 'Passport not found'));
    return successResponse(res, 200, 'Passport revoked', passport);
  } catch (err) {
    next(err);
  }
};

export const verifyPassport = async (req, res, next) => {
  try {
    const { passportId } = req.params;
    const passport = await Passport.findOne({ passportId, status: 'active' });
    if (!passport) return next(new ApiError(404, 'Passport not found or not active'));
    return successResponse(res, 200, 'Passport verified', passport);
  } catch (err) {
    next(err);
  }
};
