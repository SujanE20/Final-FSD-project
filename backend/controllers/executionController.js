import Execution from '../models/Execution.js';

export async function listExecutions(req, res, next) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  try {
    const executions = await Execution.find({ userId: req.userId })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ executions });
  } catch (error) {
    return next(error);
  }
}

export async function getExecution(req, res, next) {
  try {
    const execution = await Execution.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!execution) return res.status(404).json({ message: 'Execution not found.' });
    return res.json({ execution });
  } catch (error) {
    return next(error);
  }
}
