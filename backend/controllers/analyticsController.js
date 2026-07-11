import Activity from '../models/Activity.js';
import Passport from '../models/Passport.js';
import Notification from '../models/Notification.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Get dashboard summary stats.
 */
export const getSummary = async (req, res, next) => {
  try {
    const totalPassports = await Passport.countDocuments();
    const activePassports = await Passport.countDocuments({ status: 'active' });
    const totalActivities = await Activity.countDocuments();
    const riskCounts = await Activity.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
    ]);
    const avgTrustScore = await Passport.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$trustScore' } } },
    ]);
    const pendingApprovals = await Activity.countDocuments({ decision: 'pending' });
    const recentActivities = await Activity.find().sort({ createdAt: -1 }).limit(5);
    const unreadNotifications = await Notification.countDocuments({ isRead: false });

    const data = {
      totalPassports,
      activePassports,
      totalActivities,
      riskCounts,
      avgTrustScore: avgTrustScore[0]?.avgScore || 0,
      pendingApprovals,
      recentActivities,
      unreadNotifications,
    };
    return successResponse(res, 200, 'Analytics summary', data);
  } catch (err) {
    next(err);
  }
};
