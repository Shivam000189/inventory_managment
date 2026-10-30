import React, { useState } from 'react';
import { Users, Plus, Shield, UserCheck, X, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const TeamPage: React.FC = () => {
  const { users, addUser, updateUserStatus } = useApp();
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('salesperson');
  const [tempPassword, setTempPassword] = useState('Pass@1234');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
      name,
      email,
      role,
      avatarInitials: name.slice(0, 2).toUpperCase(),
      status: 'active',
    });
    setName('');
    setEmail('');
    setIsAddDrawerOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Team & Access Control
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Manage users, role permissions (Admin vs Salesperson), and store staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start"
        >
          <Plus size={16} />
          <span>+ Add Member</span>
        </button>
      </div>

      {/* Role explanation banner */}
      <div className="bg-[#FAF6EF] border border-[#EEE6DA] rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#EEE6DA] flex items-center justify-center text-[#7FAE82] shrink-0">
            <Shield size={16} />
          </div>
          <div>
            <div className="font-bold text-[#1C1B18]">Admin (Owner)</div>
            <p className="text-[#6B665E] mt-0.5 leading-relaxed">
              Full unconstrained access to dashboard, products, stock adjustments, suppliers, purchase orders, financial reports, team, and settings.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#EEE6DA] flex items-center justify-center text-[#E8772E] shrink-0">
            <UserCheck size={16} />
          </div>
          <div>
            <div className="font-bold text-[#1C1B18]">Salesperson</div>
            <p className="text-[#6B665E] mt-0.5 leading-relaxed">
              Restricted exclusively to POS terminal and own billing records. All back-office pages are hidden and blocked by security guards.
            </p>
          </div>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
            <tr>
              <th className="py-3 px-4">Team Member</th>
              <th className="py-3 px-3">Role</th>
              <th className="py-3 px-3">Email Address</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3">Last Active</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEE6DA]/80">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#FAF6EF]/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-bold text-xs uppercase">
                      {u.avatarInitials}
                    </div>
                    <span className="font-bold text-[#1C1B18] text-[13px]">{u.name}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <Badge variant={u.role === 'admin' ? 'primary' : 'warning'}>
                    {u.role === 'admin' ? 'Owner / Admin' : 'Salesperson'}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-[#6B665E]">{u.email}</td>
                <td className="py-3 px-3 text-center">
                  <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                    {u.status === 'active' ? 'Active' : 'Suspended'}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-[#6B665E]">{u.lastLogin}</td>
                <td className="py-3 px-4 text-right">
                  {u.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() =>
                        updateUserStatus(
                          u.id,
                          u.status === 'active' ? 'suspended' : 'active'
                        )
                      }
                      className="px-2.5 py-1 text-xs rounded-lg border border-[#EEE6DA] text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF]"
                    >
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Member Drawer */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setIsAddDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-[#EEE6DA] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 p-5">
              <div>
                <div className="flex items-center justify-between border-b border-[#EEE6DA] pb-3 mb-4">
                  <h3 className="font-bold text-base text-[#1C1B18]">Add Team Member</h3>
                  <button
                    type="button"
                    onClick={() => setIsAddDrawerOpen(false)}
                    className="p-1 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form id="team-form" onSubmit={handleAddMember} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#1C1B18] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Deepak Joshi"
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C1B18] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deepak@inventry.app"
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C1B18] mb-1">Temporary Password</label>
                    <input
                      type="text"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C1B18] mb-1">Designated Role *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
                    >
                      <option value="salesperson">Salesperson (POS & Bills Only)</option>
                      <option value="admin">Admin (Full System Access)</option>
                    </select>
                  </div>
                </form>
              </div>

              <div className="pt-4 border-t border-[#EEE6DA] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B665E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="team-form"
                  className="px-5 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold"
                >
                  Create Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
