import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { formatDate, getApiError } from '../utils/format.js';
import StatePanel from '../components/StatePanel.jsx';

function AnalyticsChart({ weekly }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const records = weekly.filter((item) => item._id.day === key);
    return {
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      success: records.find((item) => item._id.status === 'success')?.count || 0,
      failed: records.find((item) => item._id.status === 'failed')?.count || 0,
    };
  });
  const max = Math.max(1, ...days.map((day) => day.success + day.failed));

  return (
    <div className="chart-area" aria-label="Execution analytics for the last seven days">
      <div className="chart-legend"><span><i className="legend-success" />Successful</span><span><i className="legend-failed" />Failed</span></div>
      <div className="chart-bars">
        {days.map((day) => (
          <div className="chart-column" key={day.label}>
            <div className="chart-bar-stack" title={`${day.success} successful, ${day.failed} failed`}>
              <span className="chart-bar success-bar" style={{ height: `${Math.max(day.success ? 8 : 0, (day.success / max) * 145)}px` }} />
              <span className="chart-bar failed-bar" style={{ height: `${Math.max(day.failed ? 8 : 0, (day.failed / max) * 145)}px` }} />
            </div>
            <small>{day.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data: result }) => setData(result))
      .catch((requestError) => setError(getApiError(requestError, 'Could not load dashboard statistics.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StatePanel loading={loading} error={error}>
      {data && (
        <div className="dashboard-page">
          <div className="page-intro-row">
            <div><p className="page-intro">Here’s what’s happening across your automations.</p></div>
            <Link className="button-primary" to="/workflows/new">＋ Create workflow</Link>
          </div>
          <div className="stat-grid">
            <article className="stat-card"><span className="stat-icon lavender">◇</span><p>Total workflows</p><strong>{data.stats.totalWorkflows}</strong><small>Across your workspace</small></article>
            <article className="stat-card"><span className="stat-icon mint">▶</span><p>Active workflows</p><strong>{data.stats.activeWorkflows}</strong><small>Ready to run</small></article>
            <article className="stat-card"><span className="stat-icon amber">Ⅱ</span><p>Inactive workflows</p><strong>{data.stats.inactiveWorkflows}</strong><small>Draft or paused</small></article>
            <article className="stat-card"><span className="stat-icon lavender">◷</span><p>Successful runs</p><strong>{data.stats.successfulExecutions}</strong><small>Completed executions</small></article>
            <article className="stat-card"><span className="stat-icon rose">!</span><p>Failed runs</p><strong>{data.stats.failedExecutions}</strong><small>Needs your attention</small></article>
          </div>
          <div className="dashboard-grid">
            <section className="surface-card analytics-card">
              <div className="section-heading"><div><h2>Execution analytics</h2><p>Workflow runs over the last 7 days</p></div><Link to="/executions">View history →</Link></div>
              <AnalyticsChart weekly={data.weekly} />
            </section>
            <section className="surface-card">
              <div className="section-heading"><div><h2>Recent activity</h2><p>Your latest workflow runs</p></div></div>
              {data.recentExecutions.length ? <div className="activity-list">
                {data.recentExecutions.map((run) => <Link className="activity-item" key={run._id} to={`/executions/${run._id}`}>
                  <span className={`activity-status ${run.status}`} />
                  <span className="activity-copy"><strong>{run.workflowName}</strong><small>{formatDate(run.startedAt)}</small></span>
                  <span className={`status-badge ${run.status}`}>{run.status}</span>
                </Link>)}
              </div> : <div className="empty-compact">No activity yet. Run a workflow to see it here.</div>}
            </section>
          </div>
        </div>
      )}
    </StatePanel>
  );
}
