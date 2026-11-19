const operators = new Set(['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'contains']);

export function readPath(value, path) {
  if (!path) return undefined;
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, value);
}

export function evaluateCondition(actual, operator, expected) {
  if (!operators.has(operator)) {
    throw new Error(`Unsupported condition operator: ${operator}`);
  }

  const leftNumber = Number(actual);
  const rightNumber = Number(expected);
  const numeric = actual !== '' && expected !== '' && Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
  const left = numeric ? leftNumber : actual;
  const right = numeric ? rightNumber : expected;

  switch (operator) {
    case 'equals':
      return String(left ?? '').toLowerCase() === String(right ?? '').toLowerCase();
    case 'not_equals':
      return String(left ?? '').toLowerCase() !== String(right ?? '').toLowerCase();
    case 'greater_than':
      return numeric && leftNumber > rightNumber;
    case 'less_than':
      return numeric && leftNumber < rightNumber;
    case 'greater_or_equal':
      return numeric && leftNumber >= rightNumber;
    case 'less_or_equal':
      return numeric && leftNumber <= rightNumber;
    case 'contains':
      if (Array.isArray(actual)) return actual.some((item) => String(item).toLowerCase() === String(expected).toLowerCase());
      return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    default:
      return false;
  }
}

export function validateGraph(nodes, edges) {
  const errors = [];
  if (!Array.isArray(nodes) || nodes.length === 0) return { valid: false, errors: ['Add at least one node.'] };
  if (nodes.length > 100) return { valid: false, errors: ['A workflow can contain at most 100 nodes.'] };
  if (!Array.isArray(edges) || edges.length > 300) return { valid: false, errors: ['A workflow can contain at most 300 connections.'] };
  if (nodes.some((node) => !node || typeof node !== 'object' || typeof node.id !== 'string' || typeof node.type !== 'string')) {
    return { valid: false, errors: ['Every node must have a string ID and node type.'] };
  }
  if (edges.some((edge) => !edge || typeof edge !== 'object' || typeof edge.source !== 'string' || typeof edge.target !== 'string')) {
    return { valid: false, errors: ['Every connection must include a source and target node ID.'] };
  }

  const ids = new Set();
  for (const node of nodes) {
    if (!node.id || ids.has(node.id)) errors.push('Every node must have a unique ID.');
    ids.add(node?.id);
  }

  const triggers = nodes.filter((node) => node.type === 'trigger');
  if (triggers.length !== 1) errors.push('A workflow must have exactly one trigger node.');
  const validTypes = new Set(['trigger', 'condition', 'action', 'notification', 'end']);
  if (nodes.some((node) => !validTypes.has(node.type))) errors.push('The workflow contains an unsupported node type.');
  const validTriggers = new Set(['manual', 'task_created', 'task_completed', 'user_registered', 'payment_received', 'form_submitted']);
  const validActions = new Set(['create_task', 'update_task', 'update_project_progress', 'change_task_status', 'generate_notification', 'save_execution_log', 'notification']);

  for (const node of nodes) {
    if (node.type === 'trigger' && !validTriggers.has(node.data?.triggerType || 'manual')) {
      errors.push(`“${node.data?.label || 'Trigger'}” uses an unsupported event type.`);
    }
    if (node.type === 'condition') {
      if (!node.data?.field?.trim()) errors.push(`“${node.data?.label || 'Condition'}” needs an event field.`);
      if (!operators.has(node.data?.operator || 'equals')) errors.push(`“${node.data?.label || 'Condition'}” uses an unsupported comparison.`);
    }
    if (node.type === 'action') {
      const actionType = node.data?.actionType || 'notification';
      if (!validActions.has(actionType)) errors.push(`“${node.data?.label || 'Action'}” uses an unsupported action.`);
      if (actionType === 'create_task' && !node.data?.title?.trim()) errors.push(`“${node.data?.label || 'Action'}” needs a task title.`);
      if (['update_task', 'change_task_status'].includes(actionType) && !node.data?.taskId?.trim()) {
        errors.push(`“${node.data?.label || 'Action'}” needs a task ID.`);
      }
      if (actionType === 'update_project_progress') {
        const progress = Number(node.data?.progress);
        if (!node.data?.projectName?.trim() || !Number.isFinite(progress) || progress < 0 || progress > 100) {
          errors.push(`“${node.data?.label || 'Action'}” needs a project name and progress from 0 to 100.`);
        }
      }
    }
  }

  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) errors.push('Every connection must point to an existing node.');
  }

  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  const incomingCount = new Map(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    if (outgoing.has(edge.source) && incomingCount.has(edge.target)) {
      outgoing.get(edge.source).push(edge);
      incomingCount.set(edge.target, incomingCount.get(edge.target) + 1);
    }
  }

  for (const node of nodes) {
    if (node.type !== 'trigger' && incomingCount.get(node.id) === 0) {
      errors.push(`“${node.data?.label || node.type}” is not connected to the workflow.`);
    }
    if (node.type !== 'end' && (outgoing.get(node.id) || []).length === 0) {
      errors.push(`“${node.data?.label || node.type}” needs an outgoing connection.`);
    }
    if (node.type === 'condition') {
      const handles = new Set((outgoing.get(node.id) || []).map((edge) => edge.sourceHandle));
      if (!handles.has('true') || !handles.has('false')) {
        errors.push(`“${node.data?.label || 'Condition'}” must have TRUE and FALSE branches.`);
      }
    }
  }

  if (triggers.length === 1 && ids.has(triggers[0].id)) {
    const visited = new Set();
    const active = new Set();
    function visit(id) {
      if (active.has(id)) return false;
      if (visited.has(id)) return true;
      active.add(id);
      for (const edge of outgoing.get(id) || []) {
        if (!visit(edge.target)) return false;
      }
      active.delete(id);
      visited.add(id);
      return true;
    }

    if (!visit(triggers[0].id)) errors.push('Workflow connections contain a cycle.');
    if (visited.size !== nodes.length) errors.push('Every node must be reachable from the trigger.');
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
