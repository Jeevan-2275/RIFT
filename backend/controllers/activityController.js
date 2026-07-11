import Activity from '../models/Activity.js';
import Permission from '../models/Permission.js';
import { successResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { analyzeActivity } from '../services/aiGuardianService.js';
import { socketService } from '../services/socketService.js';

// Get activity timeline for a passport
export const getActivities = async (req, res, next) => {
  try {
    const { passportId } = req.params;
    // Ensure the passport belongs to the user (owner check omitted for brevity)
    const activities = await Activity.find({ passportId }).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Activities retrieved', activities);
  } catch (err) {
    next(err);
  }
};

// Submit an action request that needs AI risk evaluation
export const submitActionRequest = async (req, res, next) => {
  try {
    const { passportId, actionRequested, actionDetail, requestPayload } = req.body;
    // Verify passport exists and is active
    const passport = await (await import('../models/Passport.js')).default.findOne({ _id: passportId, status: 'active' });
    if (!passport) return next(new ApiError(404, 'Passport not found or inactive'));

    // Check permissions for the requested resource (simplified)
    const permission = await Permission.findOne({ passportId, targetResource: actionRequested });
    if (!permission) return next(new ApiError(403, 'No permission for this action'));

    // Analyze with AI Guardian
    const analysis = await analyzeActivity({ passportId, actionRequested, actionDetail, requestPayload });

    // Create activity record
    const activity = await Activity.create({
      passportId,
      userId: req.user.id,
      actionRequested,
      actionDetail,
      requestPayload,
      riskLevel: analysis.riskLevel,
      riskScore: analysis.riskScore,
      geminiReasoning: analysis.reasoning,
      decision: analysis.verdict,
    });

    // Auto-approve low risk, otherwise ask user via socket
    if (analysis.riskLevel === 'LOW') {
      // Already approved in activity
      return successResponse(res, 201, 'Action auto-approved', activity);
    }

    // For higher risk, send socket approval request and await response
    const userDecision = await socketService.sendApprovalRequest(req.user.id, activity);
    // Update activity based on decision
    activity.decision = userDecision;
    await activity.save();
    return successResponse(res, 201, `Action ${userDecision}`, activity);
  } catch (err) {
    next(err);
  }
};

// Resolve pending activity (approve/reject) - called by socket response handling already, but exposed for API if needed
export const resolveActivity = async (req, res, next) => {
  try {
    const { id } = req.params; // activity id
    const { decision } = req.body; // 'approved' or 'rejected'
    const activity = await Activity.findById(id);
    if (!activity) return next(new ApiError(404, 'Activity not found'));
    activity.decision = decision;
    await activity.save();
    return successResponse(res, 200, 'Activity decision updated', activity);
  } catch (err) {
    next(err);
  }
};
