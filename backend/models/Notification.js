import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['alert', 'info', 'critical'], default: 'info' },
    isRead: { type: Boolean, default: false },
    relatedActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
