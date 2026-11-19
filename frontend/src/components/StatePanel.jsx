export default function StatePanel({ error, loading, empty, children }) {
  if (loading) return <div className="state-panel"><span className="spinner" /> Loading your workspace…</div>;
  if (error) return <div className="state-panel state-error" role="alert">{error}</div>;
  if (empty) return <div className="state-panel">{empty}</div>;
  return children;
}
