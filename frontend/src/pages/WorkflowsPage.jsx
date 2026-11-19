import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import StatePanel from '../components/StatePanel.jsx';
import { formatDate, getApiError } from '../utils/format.js';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/workflows');
      setWorkflows(data.workflows);
      setError('');
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not load workflows.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runWorkflow(workflow) {
    try {
      await api.post(`/workflows/${workflow._id}/trigger`, {
        triggerType: workflow.nodes.find((node) => node.type === 'trigger')?.data?.triggerType || 'manual',
        eventData: { status: 'completed', source: 'manual' },
      });
      await load();
    } catch (requestError) {
      setError(getApiError(requestError, 'Workflow run failed.'));
    }
  }

  async function removeWorkflow(workflow) {
    if (!window.confirm(`Delete “${workflow.name}” and its execution history?`)) return;
    try {
      await api.delete(`/workflows/${workflow._id}`);
      setWorkflows((current) => current.filter((item) => item._id !== workflow._id));
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not delete workflow.'));
    }
  }

  async function toggleStatus(workflow) {
    try {
      await api.put(`/workflows/${workflow._id}`, {
        name: workflow.name,
        description: workflow.description,
        nodes: workflow.nodes,
        edges: workflow.edges,
        status: workflow.status === 'active' ? 'inactive' : 'active',
      });
      await load();
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not update workflow status.'));
    }
  }

  return (
    <div className="page-stack">
      <div className="page-intro-row">
        <p className="page-intro">Build, manage, and run your automations.</p>
        <Link className="button-primary" to="/workflows/new">＋ Create workflow</Link>
      </div>
      <StatePanel loading={loading} error={error} empty={!workflows.length && <div className="empty-state"><span className="empty-icon">◇</span><h2>Your workflows start here</h2><p>Connect triggers, conditions, and actions in a visual canvas.</p><Link className="button-primary" to="/workflows/new">Create your first workflow</Link></div>}>
        {workflows.length > 0 && <div className="surface-card table-card"><table className="data-table">
          <thead><tr><th>Workflow</th><th>Status</th><th>Runs</th><th>Last updated</th><th>Actions</th></tr></thead>
          <tbody>{workflows.map((workflow) => <tr key={workflow._id}>
            <td><strong>{workflow.name}</strong><small>{workflow.description || `${workflow.nodes.length} nodes`}</small></td>
            <td><span className={`status-badge ${workflow.status}`}>{workflow.status}</span></td>
            <td>{workflow.executionCount}</td>
            <td>{formatDate(workflow.updatedAt)}</td>
            <td><div className="table-actions">
              <button type="button" onClick={() => runWorkflow(workflow)}>Run</button>
              <Link to={`/workflows/${workflow._id}/edit`}>Edit</Link>
              <button type="button" onClick={() => toggleStatus(workflow)}>{workflow.status === 'active' ? 'Pause' : 'Activate'}</button>
              <button className="danger-text" type="button" onClick={() => removeWorkflow(workflow)}>Delete</button>
            </div></td>
          </tr>)}</tbody>
        </table></div>}
      </StatePanel>
    </div>
  );
}
