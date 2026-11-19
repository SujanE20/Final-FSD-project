import Execution from '../models/Execution.js';
import Notification from '../models/Notification.js';
import Workflow from '../models/Workflow.js';
import { executeAction } from './actionExecutor.js';
import { evaluateCondition, readPath, validateGraph } from './conditionEvaluator.js';

function outgoingFor(nodeId, edges) {
  return edges.filter((edge) => edge.source === nodeId);
}

function nextEdges(node, edges, conditionResult) {
  const outgoing = outgoingFor(node.id, edges);
  if (node.type !== 'condition') return outgoing;
  return outgoing.filter((edge) => edge.sourceHandle === (conditionResult ? 'true' : 'false'));
}

export async function runWorkflow({ workflowId, userId, eventData = {}, triggerType = 'manual' }) {
  const workflow = await Workflow.findOne({ _id: workflowId, userId });
  if (!workflow) {
    const error = new Error('Workflow not found.');
    error.status = 404;
    throw error;
  }

  const graph = validateGraph(workflow.nodes, workflow.edges);
  if (!graph.valid) {
    const error = new Error(`Workflow is invalid: ${graph.errors.join(' ')}`);
    error.status = 400;
    error.details = graph.errors;
    throw error;
  }

  const trigger = workflow.nodes.find((node) => node.type === 'trigger');
  const configuredTrigger = trigger.data?.triggerType || 'manual';
  if (triggerType !== configuredTrigger) {
    const error = new Error(`This workflow listens for “${configuredTrigger}”, not “${triggerType}”.`);
    error.status = 400;
    throw error;
  }

  const execution = await Execution.create({
    userId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    triggerType,
    input: eventData,
    status: 'running',
  });
  const completed = [];
  const visited = new Set();
  const queue = [{ node: trigger, conditionResult: null }];
  const maxSteps = 200;

  try {
    await Notification.create({
      userId,
      workflowId: workflow.id,
      executionId: execution.id,
      title: 'Workflow started',
      message: `${workflow.name} started.`,
      type: 'info',
    });

    while (queue.length) {
      if (completed.length >= maxSteps) throw new Error('Execution stopped because it exceeded 200 node steps.');
      const { node, conditionResult } = queue.shift();
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      const startedAt = new Date();
      const step = {
        nodeId: node.id,
        nodeType: node.type,
        label: node.data?.label || node.type,
        status: 'success',
        message: '',
        output: null,
        startedAt,
        endedAt: startedAt,
      };

      try {
        if (node.type === 'trigger') {
          step.output = eventData;
          step.message = `${node.data?.triggerType || 'manual'} trigger received.`;
        } else if (node.type === 'condition') {
          const field = node.data?.field || '';
          const actual = readPath(eventData, field);
          const expected = node.data?.value ?? '';
          const passed = evaluateCondition(actual, node.data?.operator || 'equals', expected);
          step.output = { field, actual, operator: node.data?.operator || 'equals', expected, result: passed };
          step.message = `Condition ${passed ? 'passed' : 'failed'} (${String(actual)} ${node.data?.operator || 'equals'} ${String(expected)}).`;
          await Notification.create({
            userId,
            workflowId: workflow.id,
            executionId: execution.id,
            title: passed ? 'Condition satisfied' : 'Condition not satisfied',
            message: `${step.label}: ${step.message}`,
            type: passed ? 'success' : 'warning',
          });
          step.branch = passed;
        } else if (node.type === 'action') {
          step.output = await executeAction({ node, userId, workflowId: workflow.id, executionId: execution.id });
          step.message = `Action executed: ${node.data?.actionType || 'notification'}.`;
        } else if (node.type === 'notification') {
          const notification = await Notification.create({
            userId,
            workflowId: workflow.id,
            executionId: execution.id,
            title: node.data?.title?.trim() || 'Workflow notification',
            message: node.data?.message?.trim() || `${workflow.name} sent a notification.`,
            type: node.data?.notificationType || 'info',
          });
          step.output = { notificationId: notification.id };
          step.message = 'Notification generated.';
        } else if (node.type === 'end') {
          step.message = 'Workflow path completed.';
        }
      } catch (error) {
        step.status = 'failed';
        step.message = error.message;
        step.endedAt = new Date();
        completed.push(step);
        throw error;
      }

      step.endedAt = new Date();
      completed.push(step);
      for (const edge of nextEdges(node, workflow.edges, step.branch)) {
        const target = workflow.nodes.find((candidate) => candidate.id === edge.target);
        if (target) queue.push({ node: target, conditionResult: null });
      }
    }

    const endedAt = new Date();
    const result = await Execution.findByIdAndUpdate(
      execution.id,
      { $set: { status: 'success', nodes: completed, endedAt, output: { steps: completed.length } } },
      { new: true },
    );
    workflow.lastExecutedAt = endedAt;
    await workflow.save();
    await Notification.create({
      userId,
      workflowId: workflow.id,
      executionId: execution.id,
      title: 'Workflow completed',
      message: `${workflow.name} completed successfully.`,
      type: 'success',
    });
    return result;
  } catch (error) {
    const endedAt = new Date();
    await Execution.findByIdAndUpdate(
      execution.id,
      { $set: { status: 'failed', nodes: completed, endedAt, errorDetails: error.message } },
    );
    await Notification.create({
      userId,
      workflowId: workflow.id,
      executionId: execution.id,
      title: 'Workflow failed',
      message: `${workflow.name} failed: ${error.message}`,
      type: 'error',
    });
    throw error;
  }
}
