import { useCallback, useEffect, useState } from 'react';
import StatePanel from '../components/StatePanel.jsx';
import api from '../services/api.js';
import { formatDate, getApiError } from '../utils/format.js';

const taskStatuses = ['todo', 'in-progress', 'completed', 'blocked'];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data.tasks);
      setError('');
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not load tasks.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createTask(event) {
    event.preventDefault();
    try {
      const { data } = await api.post('/tasks', { title, projectName });
      setTasks((current) => [data.task, ...current]);
      setTitle('');
      setProjectName('');
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not create task.'));
    }
  }

  async function updateStatus(task, status) {
    try {
      const { data } = await api.patch(`/tasks/${task._id}`, { status });
      setTasks((current) => current.map((item) => item._id === task._id ? data.task : item));
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not update task.'));
    }
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete task “${task.title}”?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      setTasks((current) => current.filter((item) => item._id !== task._id));
    } catch (requestError) {
      setError(getApiError(requestError, 'Could not delete task.'));
    }
  }

  return (
    <div className="page-stack">
      <p className="page-intro">Tasks created by workflow actions and from your workspace.</p>
      <form className="surface-card task-create-form" onSubmit={createTask}>
        <label className="inspector-field"><span>Task title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Write a task title" required maxLength={160} /></label>
        <label className="inspector-field"><span>Project (optional)</span><input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" maxLength={120} /></label>
        <button className="button-primary" type="submit">＋ Add task</button>
      </form>
      <StatePanel loading={loading} error={error} empty={!tasks.length && <div className="empty-state"><span className="empty-icon">✓</span><h2>No tasks yet</h2><p>Create a task here or add a Create Task node to a workflow.</p></div>}>
        {tasks.length > 0 && <div className="surface-card table-card"><table className="data-table">
          <thead><tr><th>Task</th><th>Project</th><th>Progress</th><th>Status</th><th>Updated</th><th /></tr></thead>
          <tbody>{tasks.map((task) => <tr key={task._id}>
            <td><strong>{task.title}</strong><small>{task.description || 'No description'}</small><small>ID: {task._id}</small></td><td>{task.projectName || '—'}</td>
            <td><span className="progress-cell"><i><b style={{ width: `${task.progress}%` }} /></i>{task.progress}%</span></td>
            <td><select className="inline-select" aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => updateStatus(task, event.target.value)}>{taskStatuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></td>
            <td>{formatDate(task.updatedAt)}</td><td><button className="danger-text" type="button" onClick={() => removeTask(task)}>Delete</button></td>
          </tr>)}</tbody>
        </table></div>}
      </StatePanel>
    </div>
  );
}
