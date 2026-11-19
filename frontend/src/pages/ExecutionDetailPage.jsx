import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import StatePanel from '../components/StatePanel.jsx';
import api from '../services/api.js';
import { formatDate, getApiError } from '../utils/format.js';

export default function ExecutionDetailPage() {
  const { executionId } = useParams();
  const [execution, setExecution] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/executions/${executionId}`)
      .then(({ data }) => setExecution(data.execution))
      .catch((requestError) => setError(getApiError(requestError, 'Could not load this execution.')))
      .finally(() => setLoading(false));
  }, [executionId]);

  return (
    <StatePanel loading={loading} error={error}>
      {execution && <div className="page-stack">
        <Link className="back-link" to="/executions">← Back to history</Link>
        <section className="surface-card detail-card">
          <div className="detail-heading"><div><p className="breadcrumb">EXECUTION DETAILS</p><h2>{execution.workflowName}</h2><code>{execution._id}</code></div><span className={`status-badge ${execution.status}`}>{execution.status}</span></div>
          <div className="detail-meta"><span><small>Started</small>{formatDate(execution.startedAt)}</span><span><small>Ended</small>{formatDate(execution.endedAt)}</span><span><small>Trigger</small>{execution.triggerType}</span></div>
          {execution.errorDetails && <div className="form-error"><strong>Error:</strong> {execution.errorDetails}</div>}
          <h3>Executed nodes ({execution.nodes.length})</h3>
          {execution.nodes.length ? <div className="execution-steps">
            {execution.nodes.map((step, index) => <article className="execution-step" key={`${step.nodeId}-${index}`}>
              <span className={`step-number ${step.status}`}>{step.status === 'success' ? '✓' : '!'}</span>
              <div className="step-content"><div><strong>{step.label}</strong><span className="step-type">{step.nodeType}</span></div><p>{step.message}</p>
                {step.output !== null && <details><summary>View output</summary><pre>{JSON.stringify(step.output, null, 2)}</pre></details>}
                <small>{formatDate(step.startedAt)}{step.endedAt ? ` — ${formatDate(step.endedAt)}` : ''}</small>
              </div>
            </article>)}
          </div> : <p className="page-intro">No node log was recorded.</p>}
        </section>
      </div>}
    </StatePanel>
  );
}
