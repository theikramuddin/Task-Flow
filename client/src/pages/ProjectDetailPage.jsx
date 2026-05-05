import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Users, ListTodo, UserPlus, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const getApiData = (payload) => payload?.data ?? payload;

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, { email, role });
      const member = getApiData(data);
      toast.success(`${member?.user_id?.name || email} added to project`);
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Add member</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="team@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Adding...' : 'Add member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const roleColors = { admin: 'text-indigo-700 bg-indigo-50', member: 'text-gray-600 bg-gray-100' };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      const projectData = getApiData(data) || {};
      setProject(projectData);
      setMembers(projectData.members || []);
    } catch {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const myMembership = members.find(m => m.user_id?._id === user?._id);
  const isProjectAdmin = myMembership?.role === 'admin' || user?.role === 'admin';

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!project) return <div className="p-8 text-red-400">Project not found.</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
          <span>/</span>
          <span className="text-gray-600">{project.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
          <Link to={`/projects/${id}/tasks`} className="btn-primary flex items-center gap-2">
            <ListTodo size={16} /> Task board <ArrowRight size={14} />
          </Link>
        </div>
        {project.description && <p className="text-gray-500 text-sm mt-1">{project.description}</p>}
      </div>

      {/* Members */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users size={16} /> Members ({members.length})
          </h2>
          {isProjectAdmin && (
            <button onClick={() => setShowAddMember(true)} className="btn-secondary flex items-center gap-2 text-xs">
              <UserPlus size={14} /> Add member
            </button>
          )}
        </div>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold">
                  {m.user_id?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.user_id?.name}</p>
                  <p className="text-xs text-gray-400">{m.user_id?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${roleColors[m.role]}`}>{m.role}</span>
                {isProjectAdmin && m.user_id?._id !== user?._id && (
                  <button onClick={() => removeMember(m.user_id?._id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={load}
        />
      )}
    </div>
  );
}
