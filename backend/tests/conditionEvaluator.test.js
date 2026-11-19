import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCondition,
  readPath,
  validateGraph,
} from '../services/conditionEvaluator.js';

test('evaluates string equality and case-insensitive contains', () => {
  assert.equal(evaluateCondition('Completed', 'equals', 'completed'), true);
  assert.equal(evaluateCondition('task completed', 'contains', 'COMPLETED'), true);
  assert.equal(evaluateCondition('Started', 'not_equals', 'completed'), true);
});

test('evaluates numeric comparisons safely', () => {
  assert.equal(evaluateCondition('82', 'greater_than', '75'), true);
  assert.equal(evaluateCondition(75, 'less_or_equal', 75), true);
  assert.equal(evaluateCondition('not numeric', 'greater_than', 1), false);
});

test('reads nested event fields', () => {
  assert.equal(readPath({ user: { attendance: 91 } }, 'user.attendance'), 91);
  assert.equal(readPath({ user: null }, 'user.attendance'), undefined);
});

test('accepts a connected graph with both condition branches', () => {
  const nodes = [
    { id: 'start', type: 'trigger', data: {} },
    { id: 'rule', type: 'condition', data: { field: 'status', operator: 'equals', value: 'completed' } },
    { id: 'yes', type: 'notification', data: {} },
    { id: 'no', type: 'notification', data: {} },
    { id: 'end', type: 'end', data: {} },
  ];
  const edges = [
    { source: 'start', target: 'rule' },
    { source: 'rule', target: 'yes', sourceHandle: 'true' },
    { source: 'rule', target: 'no', sourceHandle: 'false' },
    { source: 'yes', target: 'end' },
    { source: 'no', target: 'end' },
  ];

  assert.deepEqual(validateGraph(nodes, edges), { valid: true, errors: [] });
});

test('rejects cycles and missing condition branches', () => {
  const nodes = [
    { id: 'start', type: 'trigger', data: {} },
    { id: 'rule', type: 'condition', data: { field: 'status', operator: 'equals', value: 'completed' } },
    { id: 'end', type: 'end', data: {} },
  ];
  const edges = [
    { source: 'start', target: 'rule' },
    { source: 'rule', target: 'end', sourceHandle: 'true' },
    { source: 'end', target: 'rule' },
  ];
  const result = validateGraph(nodes, edges);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => message.includes('cycle')));
  assert.ok(result.errors.some((message) => message.includes('TRUE and FALSE')));
});

test('rejects malformed, disconnected, and action-incomplete workflow graphs', () => {
  assert.equal(validateGraph([{ type: 'trigger' }], []).valid, false);

  const disconnected = validateGraph([
    { id: 'start', type: 'trigger', data: { triggerType: 'manual' } },
    { id: 'end', type: 'end', data: {} },
  ], []);
  assert.equal(disconnected.valid, false);
  assert.ok(disconnected.errors.some((message) => message.includes('reachable')));

  const missingTaskTitle = validateGraph([
    { id: 'start', type: 'trigger', data: { triggerType: 'manual' } },
    { id: 'action', type: 'action', data: { actionType: 'create_task' } },
    { id: 'end', type: 'end', data: {} },
  ], [
    { source: 'start', target: 'action' },
    { source: 'action', target: 'end' },
  ]);
  assert.equal(missingTaskTitle.valid, false);
  assert.ok(missingTaskTitle.errors.some((message) => message.includes('task title')));
});
