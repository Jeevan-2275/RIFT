import { Server } from 'socket.io';
import { io as socketIo } from '../server.js'; // Re-exported from server.js

/**
 * Simple wrapper around Socket.io for consent notifications.
 */
class SocketService {
  constructor() {
    this.io = socketIo; // The shared Socket.io instance from server.js
    this.pendingActivities = new Map(); // activityId -> resolve function

    this.io.on('connection', (socket) => {
      console.log(`User socket connected: ${socket.id}`);
      socket.on('activityResponse', (data) => this.handleResponse(data, socket));
    });
  }

  /**
   * Send a pending activity approval request to a specific user.
   * @param {string} userId - MongoDB user ID.
   * @param {object} activityData - Activity details to present.
   * @returns {Promise<string>} - Resolves with "approved" or "rejected".
   */
  sendApprovalRequest(userId, activityData) {
    return new Promise((resolve) => {
      this.pendingActivities.set(activityData._id.toString(), resolve);
      this.io.to(userId).emit('approvalRequest', activityData);
    });
  }

  /**
   * Handle response from the client.
   */
  handleResponse(data, socket) {
    const { activityId, decision } = data;
    const resolver = this.pendingActivities.get(activityId);
    if (resolver) {
      resolver(decision);
      this.pendingActivities.delete(activityId);
    }
    console.log(`Received activity response ${decision} for ${activityId}`);
  }
}

export const socketService = new SocketService();
