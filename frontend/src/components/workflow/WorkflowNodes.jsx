import { Handle, Position } from '@xyflow/react';

const config = {
  trigger: { icon: '⚡', title: 'Trigger', color: 'trigger' },
  condition: { icon: '?', title: 'Condition', color: 'condition' },
  action: { icon: '↗', title: 'Action', color: 'action' },
  notification: { icon: '◉', title: 'Notification', color: 'notification' },
  end: { icon: '✓', title: 'End', color: 'end' },
};

function WorkflowNode({ id, type, data, selected }) {
  const item = config[type] || config.action;
  const subtitle = type === 'condition'
    ? `${data.field || 'field'} ${data.operator || 'equals'} ${data.value || 'value'}`
    : type === 'trigger'
      ? data.triggerType || 'manual'
      : type === 'action'
        ? data.actionType?.replaceAll('_', ' ') || 'notification'
        : data.message || data.title || item.title;

  return (
    <div className={`workflow-node ${item.color}${selected ? ' selected' : ''}`}>
      {type !== 'trigger' && <Handle type="target" position={Position.Top} />}
      <div className="node-topline">
        <span className={`node-icon ${item.color}`}>{item.icon}</span>
        <div className="node-heading"><small>{item.title.toUpperCase()}</small><strong>{data.label || item.title}</strong></div>
        <span className="node-menu" aria-label={`Node ${id}`}>···</span>
      </div>
      <p className="node-subtitle">{subtitle}</p>
      {type === 'condition' ? (
        <>
          <span className="branch-label branch-true">TRUE</span>
          <span className="branch-label branch-false">FALSE</span>
          <Handle id="true" type="source" position={Position.Bottom} style={{ left: '28%', background: '#2ca77a' }} />
          <Handle id="false" type="source" position={Position.Bottom} style={{ left: '72%', background: '#e18a5c' }} />
        </>
      ) : type !== 'end' ? <Handle type="source" position={Position.Bottom} /> : null}
    </div>
  );
}

export const workflowNodeTypes = {
  trigger: WorkflowNode,
  condition: WorkflowNode,
  action: WorkflowNode,
  notification: WorkflowNode,
  end: WorkflowNode,
};
