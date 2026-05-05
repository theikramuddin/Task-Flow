import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const getApiData = (payload) => payload?.data ?? payload;

const COLUMNS = [
  { id: 'todo',        label: 'To do',       color: 'bg-gray-100 text-gray-700' },
  { id: 'in_progress', label: 'In progress',  color: 'bg-blue-100 text-blue-700' },
  { id: 'done',        label: 'Done',         color: 'bg-green-100 text-green-700' },
];

const priorityColors = {
  high:   'text-red-600 bg-red-50 border border-red-100',
  medium: 'text-amber-600 bg-amber-50 border border-amber-100',
  low:    'text-green-600 bg-green-50 border border-green-100',
};

function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || undefined, due_date: form.due_date || undefined };
      const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
      toast.success('Task created');
      onCreated(getApiData(data));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">New task</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
            <select className="input" value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}>
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.user_id?._id} value={m.user_id?._id}>{m.user_id?.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete }) {
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (status) => {
    setUpdating(true);
    try {
      await api.patch(`/tasks/${task._id}`, { status });
      onStatusChange(task._id, status);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
        <button onClick={() => onDelete(task._id)} className="text-gray-200 hover:text-red-400 shrink-0 transition-colors">
          <X size={14} />
        </button>
      </div>
      {task.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
        {task.assigned_to && (
          <span className="badge bg-indigo-50 text-indigo-600">{task.assigned_to.name}</span>
        )}
        {task.due_date && (
          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="mt-3 flex gap-1">
        {COLUMNS.filter(c => c.id !== task.status).map(col => (
          <button
            key={col.id}
            disabled={updating}
            onClick={() => changeStatus(col.id)}
            className="text-xs px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-100 transition-colors disabled:opacity-40"
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TaskBoardPage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      const [tasksRes, projRes] = await Promise.all([
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}`),
      ]);
      const tasksData = getApiData(tasksRes.data) || [];
      const projectData = getApiData(projRes.data) || {};

      setTasks(tasksData);
      setMembers(projectData.members || []);
      setProjectName(projectData.name || '');
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const handleStatusChange = (taskId, status) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading tasks...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-indigo-600">{projectName}</Link>
            <span>/</span>
            <span className="text-gray-600">Tasks</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Task board</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New task
        </button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="flex flex-col">
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 ${col.color}`}>
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="text-xs font-medium opacity-75">{colTasks.length}</span>
              </div>
              <div className="space-y-2 flex-1">
                {colTasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="text-xs text-gray-300 text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateTaskModal
          projectId={projectId}
          members={members}
          onClose={() => setShowCreate(false)}
          onCreated={task => setTasks(prev => [task, ...prev])}
        />
      )}
    </div>
  );
}
