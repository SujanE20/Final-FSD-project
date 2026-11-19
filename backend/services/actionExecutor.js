import Notification from '../models/Notification.js';
import Task from '../models/Task.js';

export async function executeAction({ node, userId, workflowId, executionId }) {
  const data = node.data || {};
  const actionType = data.actionType || 'notification';

  if (actionType === 'create_task') {
    if (!data.title?.trim()) throw new Error('Create Task requires a task title.');
    const task = await Task.create({
      userId,
      workflowId,
      title: data.title.trim(),
      description: data.description || '',
      status: data.status || 'todo',
      projectName: data.projectName || '',
      progress: Number(data.progress) || 0,
    });
    return { taskId: task.id, title: task.title, status: task.status };
  }

  if (actionType === 'update_task' || actionType === 'change_task_status') {
    if (!data.taskId) throw new Error('This task action requires a task ID.');
    const update = {};
    if (actionType === 'change_task_status' || data.status) update.status = data.status || 'in-progress';
    if (data.title) update.title = data.title.trim();
    if (data.description !== undefined) update.description = data.description;
    if (typeof data.progress !== 'undefined') update.progress = Number(data.progress);
    const task = await Task.findOneAndUpdate(
      { _id: data.taskId, userId },
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!task) throw new Error('The task was not found in your account.');
    return { taskId: task.id, title: task.title, status: task.status, progress: task.progress };
  }

  if (actionType === 'update_project_progress') {
    if (!data.projectName?.trim()) throw new Error('Update Project Progress requires a project name.');
    const progress = Number(data.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      throw new Error('Project progress must be between 0 and 100.');
    }
    const result = await Task.updateMany(
      { userId, projectName: data.projectName.trim() },
      { $set: { progress } },
    );
    return { projectName: data.projectName.trim(), progress, updatedTasks: result.modifiedCount };
  }

  if (actionType === 'generate_notification' || actionType === 'notification') {
    const message = data.message?.trim() || 'A workflow action was completed.';
    const notification = await Notification.create({
      userId,
      workflowId,
      executionId,
      title: data.title?.trim() || 'Workflow notification',
      message,
      type: data.notificationType || 'info',
    });
    return { notificationId: notification.id, message };
  }

  if (actionType === 'save_execution_log') {
    return { saved: true, message: data.message?.trim() || 'Execution log saved.' };
  }

  throw new Error(`Unsupported action: ${actionType}`);
}
