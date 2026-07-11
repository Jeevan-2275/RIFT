import Permission from '../models/Permission.js';
import { successResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

export const createPermission = async (req, res, next) => {
  try {
    const { passportId, targetResource, allowedActions, dailyLimitUSD, status } = req.body;
    const permission = await Permission.create({
      passportId,
      targetResource,
      allowedActions,
      dailyLimitUSD,
      status,
    });
    return successResponse(res, 201, 'Permission created', permission);
  } catch (err) {
    next(err);
  }
};

export const getPermissions = async (req, res, next) => {
  try {
    const { passportId } = req.params;
    const permissions = await Permission.find({ passportId });
    return successResponse(res, 200, 'Permissions retrieved', permissions);
  } catch (err) {
    next(err);
  }
};

export const updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const permission = await Permission.findByIdAndUpdate(id, updates, { new: true });
    if (!permission) return next(new ApiError(404, 'Permission not found'));
    return successResponse(res, 200, 'Permission updated', permission);
  } catch (err) {
    next(err);
  }
};

export const deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const permission = await Permission.findByIdAndDelete(id);
    if (!permission) return next(new ApiError(404, 'Permission not found'));
    return successResponse(res, 200, 'Permission deleted', permission);
  } catch (err) {
    next(err);
  }
};
