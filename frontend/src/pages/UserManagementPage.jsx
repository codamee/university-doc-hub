import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  Lock,
  Mail,
  Building,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add User modal
  const [addUserModal, setAddUserModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'Reviewer',
    department: 'Academic Admissions'
  });
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.list();
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg('');

    try {
      const res = await usersAPI.create(formData);
      if (res.data.success) {
        setAddUserModal(false);
        setFormData({
          name: '',
          email: '',
          password: 'password123',
          role: 'Reviewer',
          department: 'Academic Admissions'
        });
        fetchUsers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'User creation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await usersAPI.update(user.id, { status: newStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Status update failed');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            User Directory & Least-Privilege Role Governance
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Manage university users, enforce role-based access policies, and audit administrative assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddUserModal(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add New User
          </button>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Least-Privilege Role Authorization Matrix</h2>
        <p className="text-[11px] text-slate-500 mb-4">Core domain permissions defined by University SecOps</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3 text-center">Intake Upload</th>
                <th className="py-2 px-3 text-center">AI Extraction</th>
                <th className="py-2 px-3 text-center">Field Validation</th>
                <th className="py-2 px-3 text-center">Override Decisions</th>
                <th className="py-2 px-3 text-center">Reassign Cases</th>
                <th className="py-2 px-3 text-center">Audit Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800">Applicant</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ (Own)</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ (View)</td>
                <td className="py-2.5 px-3 text-center text-slate-300">&mdash;</td>
                <td className="py-2.5 px-3 text-center text-slate-300">&mdash;</td>
                <td className="py-2.5 px-3 text-center text-slate-300">&mdash;</td>
                <td className="py-2.5 px-3 text-center text-slate-300">&mdash;</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800">Reviewer</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-slate-300">&mdash;</td>
                <td className="py-2.5 px-3 text-center text-slate-300">&mdash;</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800">Supervisor</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800">Compliance Admin</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ (Full)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active University Users</h2>
            <p className="text-[11px] text-slate-500">Authorized operators and roles</p>
          </div>
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Name & Email</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Account Status</th>
                <th className="py-2.5 px-3">Last Login</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {u.department}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={u.status || 'ACTIVE'} />
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-500">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-xs font-semibold transition-colors"
                    >
                      {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {addUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add New University User</h3>
            <p className="text-xs text-slate-500 mb-4">Provision role and departmental access</p>

            {errorMsg && (
              <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Priya Nair"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  University Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="netid@university.edu"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="Applicant">Applicant</option>
                  <option value="Reviewer">Reviewer</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Compliance Admin">Compliance Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Academic Admissions"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;

