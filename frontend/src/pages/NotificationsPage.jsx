import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatePanel from '../components/StatePanel.jsx';
import api from '../services/api.js';
import { formatDate, getApiError } from '../utils/format.js';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setError('');
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not load notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not update notifications.'));
    }
  }

  async function markRead(item) {
    if (item.isRead) return;
    try {
      const { data } = await api.patch(`/notifications/${item._id}/read`);
      setNotifications((current) => current.map((notification) => notification._id === item._id ? data.notification : notification));
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not mark notification as read.'));
    }
  }

  return (
    <div className="page-stack">
      <div className="page-intro-row"><p className="page-intro">Workflow run results and important updates.</p><button className="button-secondary" type="button" disabled={!notifications.some((item) => !item.isRead)} onClick={markAllRead}>Mark all as read</button></div>
      <StatePanel loading={loading} error={error} empty={!notifications.length && <div className="empty-state"><span className="empty-icon">◉</span><h2>You’re all caught up</h2><p>Workflow notifications will show up here.</p></div>}>
        {notifications.length > 0 && <div className="notification-list">{notifications.map((item) => <article className={`notification-card${item.isRead ? '' : ' unread'}`} key={item._id}>
          <span className={`notification-icon ${item.type}`}>{item.type === 'success' ? '✓' : item.type === 'error' ? '!' : item.type === 'warning' ? '△' : '◉'}</span>
          <div className="notification-copy"><strong>{item.title}</strong><p>{item.message}</p><small>{formatDate(item.createdAt)}</small></div>
          <div className="notification-actions">{!item.isRead && <button type="button" onClick={() => markRead(item)}>Mark read</button>}{item.executionId && <Link to={`/executions/${item.executionId}`}>View run →</Link>}</div>
        </article>)}</div>}
      </StatePanel>
    </div>
  );
}
