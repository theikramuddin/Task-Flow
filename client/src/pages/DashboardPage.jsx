import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Clock, ListTodo, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const priorityColors = { high: 'text-red-600 bg-red-50', medium: 'text-amber-600 bg-amber-50', low: 'text-green-600 bg-green-50' };
const statusColors = { todo: 'text-gray-600 bg-gray-100', in_progress: 'text-blue-600 bg-blue-50', done: 'text-green-600 bg-green-50' };

const emptyDashboard = {
  summary: { total: 0, done: 0, in_progress: 0, overdue: 0 },
  overdue_tasks: [],
  my_tasks: [],
};

function normalizeDashboard(payload) {
  const dashboard = payload?.data || payload || {};
  const tasksByStatus = dashboard.tasksByStatus || {};
  const overdueTasks = dashboard.overdueTasks || dashboard.overdue_tasks || [];

  return {
    summary: dashboard.summary || {
      total: dashboard.totalTasks ?? tasksByStatus.total ?? 0,
      done: tasksByStatus.done ?? 0,
      in_progress: tasksByStatus.in_progress ?? 0,
      overdue: dashboard.overdue ?? overdueTasks.length,
    },
    overdue_tasks: overdueTasks,
    my_tasks: dashboard.assignedToMe || dashboard.my_tasks || [],
  };
}

function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard');
      setData(normalizeDashboard(res.data));
    } catch {
      setData(emptyDashboard);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading dashboard...</div>;
  if (!data) return null;

  const { summary, overdue_tasks, my_tasks } = data;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <button onClick={fetch} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ListTodo}     label="Total tasks"   value={summary.total}      color="indigo" />
        <StatCard icon={CheckCircle}  label="Done"          value={summary.done}       color="green" />
        <StatCard icon={Clock}        label="In progress"   value={summary.in_progress} color="amber" />
        <StatCard icon={AlertTriangle} label="Overdue"      value={summary.overdue}    color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My tasks */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Assigned to me</h2>
          {my_tasks.length === 0 ? (
            <p className="text-sm text-gray-400">No pending tasks assigned to you.</p>
          ) : (
            <div className="space-y-2">
              {my_tasks.map(task => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.project_id?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
                    {task.due_date && (
                      <span className="text-xs text-gray-400">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue tasks */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            Overdue tasks
          </h2>
          {overdue_tasks.length === 0 ? (
            <p className="text-sm text-gray-400">No overdue tasks.</p>
          ) : (
            <div className="space-y-2">
              {overdue_tasks.map(task => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-red-900 truncate">{task.title}</p>
                    <p className="text-xs text-red-400">{task.project_id?.name}</p>
                  </div>
                  <span className="text-xs text-red-500 ml-3 shrink-0">
                    Due {new Date(task.due_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
