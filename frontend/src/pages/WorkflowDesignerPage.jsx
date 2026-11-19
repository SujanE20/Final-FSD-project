import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';
import { getApiError } from '../utils/format.js';
import { workflowNodeTypes } from '../components/workflow/WorkflowNodes.jsx';

const initialGraph = {
  nodes: [
    { id: 'trigger-start', type: 'trigger', position: { x: 80, y: 290 }, data: { label: 'Manual Trigger', triggerType: 'manual' } },
    { id: 'condition-status', type: 'condition', position: { x: 370, y: 290 }, data: { label: 'Check task status', field: 'status', operator: 'equals', value: 'completed' } },
    { id: 'notify-success', type: 'notification', position: { x: 690, y: 135 }, data: { label: 'Success notification', title: 'Condition satisfied', message: 'The task is completed.', notificationType: 'success' } },
    { id: 'notify-warning', type: 'notification', position: { x: 690, y: 445 }, data: { label: 'Needs attention', title: 'Condition not met', message: 'The task is not completed yet.', notificationType: 'warning' } },
    { id: 'workflow-end', type: 'end', position: { x: 1010, y: 290 }, data: { label: 'Workflow complete' } },
  ],
  edges: [
    { id: 'e-start-condition', source: 'trigger-start', target: 'condition-status', type: 'smoothstep', animated: true },
    { id: 'e-condition-success', source: 'condition-status', target: 'notify-success', sourceHandle: 'true', label: 'TRUE', type: 'smoothstep', style: { stroke: '#2ca77a' }, labelStyle: { fill: '#278b69', fontWeight: 700 } },
    { id: 'e-condition-warning', source: 'condition-status', target: 'notify-warning', sourceHandle: 'false', label: 'FALSE', type: 'smoothstep', style: { stroke: '#e18a5c' }, labelStyle: { fill: '#b76a43', fontWeight: 700 } },
    { id: 'e-success-end', source: 'notify-success', target: 'workflow-end', type: 'smoothstep' },
    { id: 'e-warning-end', source: 'notify-warning', target: 'workflow-end', type: 'smoothstep' },
  ],
};

const palette = [
  { type: 'trigger', label: 'Trigger', description: 'Start an automation' },
  { type: 'condition', label: 'Condition', description: 'Branch on a rule' },
  { type: 'action', label: 'Action', description: 'Change task or progress' },
  { type: 'notification', label: 'Notification', description: 'Send an in-app update' },
  { type: 'end', label: 'End', description: 'Finish this path' },
];

const operators = [
  ['equals', 'Equal to'],
  ['not_equals', 'Not equal to'],
  ['greater_than', 'Greater than'],
  ['less_than', 'Less than'],
  ['greater_or_equal', 'Greater than or equal to'],
  ['less_or_equal', 'Less than or equal to'],
  ['contains', 'Contains'],
];

const triggerTypes = [
  ['manual', 'Manual trigger'],
  ['task_created', 'Task created'],
  ['task_completed', 'Task completed'],
  ['user_registered', 'User registered'],
  ['payment_received', 'Payment received'],
  ['form_submitted', 'Form submitted'],
];

const actionTypes = [
  ['create_task', 'Create task'],
  ['update_task', 'Update task'],
  ['update_project_progress', 'Update project progress'],
  ['change_task_status', 'Change task status'],
  ['generate_notification', 'Generate notification'],
  ['save_execution_log', 'Save execution log'],
];

function newId() {
  return globalThis.crypto?.randomUUID?.() || `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initialData() {
  return { name: 'My first workflow', description: '', status: 'draft', ...initialGraph };
}

function DesignerCanvas() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const { screenToFlowPosition } = useReactFlow();
  const canvasRef = useRef(null);
  const [workflow, setWorkflow] = useState(initialData);
  const [selectedId, setSelectedId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [eventInput, setEventInput] = useState('{\n  "status": "completed"\n}');

  useEffect(() => {
    if (!workflowId) return;
    api.get(`/workflows/${workflowId}`)
      .then(({ data }) => setWorkflow(data.workflow))
      .catch((requestError) => setError(getApiError(requestError, 'Could not load this workflow.')));
  }, [workflowId]);

  const selectedNode = workflow.nodes.find((node) => node.id === selectedId);
  const nodeTypes = useMemo(() => workflowNodeTypes, []);

  const onNodesChange = useCallback((changes) => {
    setWorkflow((current) => ({ ...current, nodes: applyNodeChanges(changes, current.nodes) }));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setWorkflow((current) => ({ ...current, edges: applyEdgeChanges(changes, current.edges) }));
  }, []);

  const onConnect = useCallback((connection) => {
    setWorkflow((current) => ({
      ...current,
      edges: addEdge({
        ...connection,
        id: `edge-${newId()}`,
        type: 'smoothstep',
        label: connection.sourceHandle === 'true' ? 'TRUE' : connection.sourceHandle === 'false' ? 'FALSE' : undefined,
      }, current.edges),
    }));
  }, []);

  function addNode(type, position) {
    if (type === 'trigger' && workflow.nodes.some((node) => node.type === 'trigger')) {
      setError('A workflow can have only one trigger.');
      return;
    }
    const defaults = {
      trigger: { label: 'Manual Trigger', triggerType: 'manual' },
      condition: { label: 'New condition', field: 'status', operator: 'equals', value: 'completed' },
      action: { label: 'New action', actionType: 'create_task', title: 'New task', status: 'todo' },
      notification: { label: 'New notification', title: 'Workflow notification', message: 'Workflow step completed.', notificationType: 'info' },
      end: { label: 'Workflow complete' },
    };
    const node = {
      id: newId(),
      type,
      position: position || { x: 180 + Math.random() * 300, y: 100 + Math.random() * 250 },
      data: defaults[type],
    };
    setWorkflow((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedId(node.id);
    setError('');
  }

  function handleDrop(event) {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/workflow-node');
    if (type && canvasRef.current) addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }

  function updateSelected(field, value) {
    setWorkflow((current) => ({
      ...current,
      nodes: current.nodes.map((node) => node.id === selectedId
        ? { ...node, data: { ...node.data, [field]: value } }
        : node),
    }));
  }

  function deleteSelected() {
    if (!selectedId) return;
    setWorkflow((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== selectedId),
      edges: current.edges.filter((edge) => edge.source !== selectedId && edge.target !== selectedId),
    }));
    setSelectedId('');
  }

  async function validateGraph() {
    const { data } = await api.post('/workflows/validate', {
      nodes: workflow.nodes,
      edges: workflow.edges,
    });
    if (!data.valid) {
      setError(data.errors.join(' '));
      setNotice('');
      return false;
    }
    setError('');
    setNotice('Workflow connections are valid.');
    return true;
  }

  async function saveWorkflow() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (!(await validateGraph())) return null;
      const payload = {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        nodes: workflow.nodes,
        edges: workflow.edges,
      };
      const { data } = workflowId
        ? await api.put(`/workflows/${workflowId}`, payload)
        : await api.post('/workflows', payload);
      setWorkflow(data.workflow);
      setNotice('Workflow saved successfully.');
      if (!workflowId) navigate(`/workflows/${data.workflow._id}/edit`, { replace: true });
      return data.workflow;
    } catch (requestError) {
      setError(requestError.response?.data?.errors?.join(' ') || getApiError(requestError, 'Could not save this workflow.'));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function runWorkflow() {
    let eventData;
    try {
      eventData = JSON.parse(eventInput);
      if (!eventData || Array.isArray(eventData) || typeof eventData !== 'object') {
        throw new Error('Provide a JSON object for test event data.');
      }
    } catch (parseError) {
      setError(parseError.message.startsWith('Provide') ? parseError.message : 'Test event data must be valid JSON.');
      return;
    }
    let saved = workflow;
    if (!workflowId) saved = await saveWorkflow();
    if (!saved?._id) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data } = await api.post(`/workflows/${saved._id}/trigger`, {
        triggerType: saved.nodes.find((node) => node.type === 'trigger')?.data?.triggerType || 'manual',
        eventData,
      });
      setNotice(`Run completed successfully with ${data.execution.nodes.length} node steps.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || getApiError(requestError, 'Workflow run failed.'));
    } finally {
      setBusy(false);
    }
  }

  const input = (label, field, props = {}) => (
    <label className="inspector-field">
      <span>{label}</span>
      <input value={selectedNode?.data?.[field] ?? ''} onChange={(event) => updateSelected(field, event.target.value)} {...props} />
    </label>
  );

  return (
    <div className="designer-page">
      <div className="designer-topbar">
        <div className="designer-title"><Link to="/workflows">← Workflows</Link><input aria-label="Workflow name" value={workflow.name} maxLength={120} onChange={(event) => setWorkflow((current) => ({ ...current, name: event.target.value }))} /></div>
        <div className="designer-tools">
          <label className="status-select-label">Status
            <select value={workflow.status} onChange={(event) => setWorkflow((current) => ({ ...current, status: event.target.value }))}>
              <option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </label>
          <button type="button" className="button-secondary" disabled={busy} onClick={() => validateGraph().catch((requestError) => setError(getApiError(requestError)))}>Validate</button>
          <button type="button" className="button-secondary" disabled={busy} onClick={saveWorkflow}>{busy ? 'Saving…' : 'Save workflow'}</button>
          <button type="button" className="button-primary" disabled={busy} onClick={runWorkflow}>{busy ? 'Running…' : '▶ Run workflow'}</button>
        </div>
      </div>
      <div className="designer-workspace">
        <aside className="node-palette">
          <div className="panel-title"><h2>Node library</h2><p>Drag a node onto the canvas</p></div>
          {palette.map((item) => <button
            className={`palette-item ${item.type}`}
            key={item.type}
            draggable
            type="button"
            onDragStart={(event) => event.dataTransfer.setData('application/workflow-node', item.type)}
            onClick={() => addNode(item.type)}
          >
            <span className={`palette-icon ${item.type}`}>{item.type === 'trigger' ? '⚡' : item.type === 'condition' ? '?' : item.type === 'action' ? '↗' : item.type === 'end' ? '✓' : '◉'}</span>
            <span><strong>{item.label}</strong><small>{item.description}</small></span>
          </button>)}
          <p className="palette-hint">Connect node handles to define the run order. Conditions branch TRUE / FALSE.</p>
        </aside>
        <div className="flow-canvas" ref={canvasRef} onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
          <ReactFlow
            nodes={workflow.nodes}
            edges={workflow.edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId('')}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            deleteKeyCode={['Backspace', 'Delete']}
            defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#dce1ed" />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>
        </div>
        <aside className="node-inspector">
          {selectedNode ? (
            <>
              <div className="panel-title"><h2>Configure node</h2><p>{selectedNode.type} settings</p></div>
              {input('Node name', 'label', { maxLength: 100 })}
              {selectedNode.type === 'trigger' && <label className="inspector-field"><span>Trigger event</span><select value={selectedNode.data.triggerType || 'manual'} onChange={(event) => updateSelected('triggerType', event.target.value)}>{triggerTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
              {selectedNode.type === 'condition' && <>
                {input('Event field', 'field', { placeholder: 'status or user.attendance' })}
                <label className="inspector-field"><span>Operator</span><select value={selectedNode.data.operator || 'equals'} onChange={(event) => updateSelected('operator', event.target.value)}>{operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                {input('Compare with', 'value', { placeholder: 'completed' })}
              </>}
              {selectedNode.type === 'action' && <>
                <label className="inspector-field"><span>Action type</span><select value={selectedNode.data.actionType || 'create_task'} onChange={(event) => updateSelected('actionType', event.target.value)}>{actionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                {['create_task', 'update_task'].includes(selectedNode.data.actionType) && <>
                  {selectedNode.data.actionType === 'update_task' && input('Task ID', 'taskId', { placeholder: 'Task record ID' })}
                  {input('Task title', 'title', { placeholder: 'Follow up with customer' })}
                  {input('Description', 'description', { placeholder: 'Optional details' })}
                  <label className="inspector-field"><span>Task status</span><select value={selectedNode.data.status || 'todo'} onChange={(event) => updateSelected('status', event.target.value)}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option></select></label>
                </>}
                {selectedNode.data.actionType === 'change_task_status' && <>
                  {input('Task ID', 'taskId', { placeholder: 'Task record ID' })}
                  <label className="inspector-field"><span>New status</span><select value={selectedNode.data.status || 'in-progress'} onChange={(event) => updateSelected('status', event.target.value)}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option></select></label>
                </>}
                {selectedNode.data.actionType === 'update_project_progress' && <>
                  {input('Project name', 'projectName', { placeholder: 'Website launch' })}
                  {input('Progress (%)', 'progress', { type: 'number', min: 0, max: 100 })}
                </>}
                {['generate_notification', 'save_execution_log'].includes(selectedNode.data.actionType) && input('Message', 'message', { placeholder: 'Describe this action' })}
              </>}
              {selectedNode.type === 'notification' && <>
                {input('Notification title', 'title', { maxLength: 160 })}
                <label className="inspector-field"><span>Message</span><textarea rows="4" value={selectedNode.data.message || ''} onChange={(event) => updateSelected('message', event.target.value)} /></label>
                <label className="inspector-field"><span>Type</span><select value={selectedNode.data.notificationType || 'info'} onChange={(event) => updateSelected('notificationType', event.target.value)}><option value="info">Information</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option></select></label>
              </>}
              <button className="danger-outline" type="button" onClick={deleteSelected}>Delete node</button>
            </>
          ) : (
            <div className="inspector-empty"><span>⌘</span><strong>Workflow settings</strong><p>Select a node to configure it, or drag a node from the library to extend this workflow.</p>
              <label className="inspector-field"><span>Description</span><textarea rows="4" value={workflow.description} maxLength={500} placeholder="What does this workflow automate?" onChange={(event) => setWorkflow((current) => ({ ...current, description: event.target.value }))} /></label>
            </div>
          )}
          <div className="test-event">
            <label htmlFor="event-data">Test event data (JSON)</label>
            <textarea id="event-data" rows="5" spellCheck="false" value={eventInput} onChange={(event) => setEventInput(event.target.value)} />
            <small>Used when you run this workflow manually.</small>
          </div>
          {error && <p className="designer-message error" role="alert">{error}</p>}
          {notice && <p className="designer-message success" role="status">{notice}</p>}
        </aside>
      </div>
    </div>
  );
}

export default function WorkflowDesignerPage() {
  return <ReactFlowProvider><DesignerCanvas /></ReactFlowProvider>;
}
