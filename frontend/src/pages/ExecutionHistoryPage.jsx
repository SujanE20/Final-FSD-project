import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatePanel from '../components/StatePanel.jsx';
import api from '../services/api.js';
import { formatDate, getApiError } from '../utils/format.js';

export default function ExecutionHistoryPage() {
  const [executions, setExecutions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/executions')
      .then(({ data }) => setExecutions(data.executions))
      .catch((requestError) => setError(getApiError(requestError, 'Could not load execution history.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-stack">
      <p className="page-intro">Review workflow runs, their node-by-node results, and errors.</p>
      <StatePanel loading={loading} error={error} empty={!executions.length && <div className="empty-state"><span className="empty-icon">↗</span><h2>No executions yet</h2><p>Run a workflow to see its execution history and logs here.</p><Link className="button-primary" to="/workflows">View workflows</Link></div>}>
        {executions.length > 0 && <div className="surface-card table-card"><table className="data-table">
          <thead><tr><th>Workflow</th><th>Execution ID</th><th>Started</th><th>Duration</th><th>Status</th><th /></tr></thead>
          <tbody>{executions.map((run) => {
            const duration = run.endedAt ? Math.max(0, new Date(run.endedAt) - new Date(run.startedAt)) : null;
            return <tr key={run._id}>
              <td><strong>{run.workflowName}</strong><small>{run.nodes.length} node steps</small></td>
              <td><code>{run._id.slice(-8)}</code></td>
              <td>{formatDate(run.startedAt)}</td>
              <td>{duration === null ? '—' : `${(duration / 1000).toFixed(2)}s`}</td>
              <td><span className={`status-badge ${run.status}`}>{run.status}</span></td>
              <td><Link className="table-link" to={`/executions/${run._id}`}>View logs →</Link></td>
            </tr>;
          })}</tbody>
        </table></div>}
      </StatePanel>
    </div>
  );
}
