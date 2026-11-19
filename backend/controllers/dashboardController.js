import mongoose from 'mongoose';
import Execution from '../models/Execution.js';
import Notification from '../models/Notification.js';
import Workflow from '../models/Workflow.js';

export async function getDashboard(req, res, next) {
  try {
    const userId = req.userId;
    const [workflowCounts, executionCounts, recentExecutions, weekly] = await Promise.all([
      Workflow.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Execution.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Execution.find({ userId }).sort({ startedAt: -1 }).limit(8).lean(),
      Execution.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), startedAt: { $gte: new Date(Date.now() - 6 * 86400000) }, status: { $in: ['success', 'failed'] } } },
        { $group: { _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } }, status: '$status' }, count: { $sum: 1 } } },
        { $sort: { '_id.day': 1 } },
      ]),
    ]);

    const workflow = Object.fromEntries(workflowCounts.map(({ _id, count }) => [_id, count]));
    const execution = Object.fromEntries(executionCounts.map(({ _id, count }) => [_id, count]));
    const unreadNotifications = await Notification.countDocuments({ userId, isRead: false });

    return res.json({
      stats: {
        totalWorkflows: Object.values(workflow).reduce((sum, count) => sum + count, 0),
        activeWorkflows: workflow.active || 0,
        inactiveWorkflows: workflow.inactive || 0,
        draftWorkflows: workflow.draft || 0,
        successfulExecutions: execution.success || 0,
        failedExecutions: execution.failed || 0,
        unreadNotifications,
      },
      recentExecutions,
      weekly,
    });
  } catch (error) {
    return next(error);
  }
}
