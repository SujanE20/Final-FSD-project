import Task from '../models/Task.js';

export async function listTasks(req, res, next) {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
    return res.json({ tasks });
  } catch (error) {
    return next(error);
  }
}

export async function createTask(req, res, next) {
  const { title, description = '', status = 'todo', projectName = '', progress = 0 } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || title.length > 160) {
    return res.status(400).json({ message: 'Task title is required and must be 160 characters or fewer.' });
  }
  try {
    const task = await Task.create({ userId: req.userId, title: title.trim(), description, status, projectName, progress });
    return res.status(201).json({ task });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return next(error);
  }
}

export async function updateTask(req, res, next) {
  const allowed = ['title', 'description', 'status', 'projectName', 'progress', 'dueDate'];
  const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(update).length) return res.status(400).json({ message: 'Provide at least one task field to update.' });
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    return res.json({ task });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}
