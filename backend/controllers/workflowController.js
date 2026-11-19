import mongoose from 'mongoose';
import Execution from '../models/Execution.js';
import Notification from '../models/Notification.js';
import Workflow from '../models/Workflow.js';
import { runWorkflow } from '../services/workflowEngine.js';
import { validateGraph } from '../services/conditionEvaluator.js';

function validateInput(body) {
  if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 120) {
    return 'Workflow name must be between 2 and 120 characters.';
  }
  if (body.description && (typeof body.description !== 'string' || body.description.length > 500)) {
    return 'Workflow description must be 500 characters or fewer.';
  }
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return 'Workflow nodes and edges must be arrays.';
  }
  return null;
}

export async function listWorkflows(req, res, next) {
  try {
    const workflows = await Workflow.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
    const counts = await Execution.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId), status: { $in: ['success', 'failed'] } } },
      { $group: { _id: '$workflowId', executions: { $sum: 1 }, lastStatus: { $last: '$status' } } },
    ]);
    const byWorkflow = new Map(counts.map((item) => [String(item._id), item]));
    return res.json({
      workflows: workflows.map((workflow) => ({
        ...workflow,
        executionCount: byWorkflow.get(String(workflow._id))?.executions || 0,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function createWorkflow(req, res, next) {
  const invalid = validateInput(req.body);
  if (invalid) return res.status(400).json({ message: invalid });
  const graph = validateGraph(req.body.nodes, req.body.edges);
  if (!graph.valid) return res.status(400).json({ message: 'Workflow graph is invalid.', errors: graph.errors });
  try {
    const workflow = await Workflow.create({
      userId: req.userId,
      name: req.body.name.trim(),
      description: req.body.description || '',
      status: req.body.status === 'active' ? 'active' : 'draft',
      nodes: req.body.nodes,
      edges: req.body.edges,
    });
    return res.status(201).json({ workflow });
  } catch (error) {
    return next(error);
  }
}

export async function getWorkflow(req, res, next) {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.userId });
    if (!workflow) return res.status(404).json({ message: 'Workflow not found.' });
    return res.json({ workflow });
  } catch (error) {
    return next(error);
  }
}

export async function updateWorkflow(req, res, next) {
  const invalid = validateInput(req.body);
  if (invalid) return res.status(400).json({ message: invalid });
  const graph = validateGraph(req.body.nodes, req.body.edges);
  if (!graph.valid) return res.status(400).json({ message: 'Workflow graph is invalid.', errors: graph.errors });
  try {
    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        $set: {
          name: req.body.name.trim(),
          description: req.body.description || '',
          status: ['active', 'inactive', 'draft'].includes(req.body.status) ? req.body.status : 'draft',
          nodes: req.body.nodes,
          edges: req.body.edges,
        },
      },
      { new: true, runValidators: true },
    );
    if (!workflow) return res.status(404).json({ message: 'Workflow not found.' });
    return res.json({ workflow });
  } catch (error) {
    return next(error);
  }
}

export async function deleteWorkflow(req, res, next) {
  try {
    const workflow = await Workflow.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!workflow) return res.status(404).json({ message: 'Workflow not found.' });
    await Promise.all([
      Execution.deleteMany({ workflowId: workflow.id, userId: req.userId }),
      Notification.deleteMany({ workflowId: workflow.id, userId: req.userId }),
    ]);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

export async function validateWorkflow(req, res) {
  const result = validateGraph(req.body.nodes, req.body.edges);
  return res.json(result);
}

export async function triggerWorkflow(req, res, next) {
  if (req.body.eventData && (typeof req.body.eventData !== 'object' || Array.isArray(req.body.eventData))) {
    return res.status(400).json({ message: 'eventData must be an object.' });
  }
  try {
    const execution = await runWorkflow({
      workflowId: req.params.id,
      userId: req.userId,
      triggerType: req.body.triggerType || 'manual',
      eventData: req.body.eventData || {},
    });
    return res.status(execution.status === 'success' ? 200 : 500).json({ execution });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message, errors: error.details || [] });
    return next(error);
  }
}
