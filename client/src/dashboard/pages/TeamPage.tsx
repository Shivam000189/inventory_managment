import React, { useState } from 'react';
import { Plus, Shield, UserCheck, X, Mail, Clock, Copy, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import { Portal } from '../components/common/Portal';
import { isPharmacyBusiness } from '../../shared/industryConfig';

export const TeamPage: React.FC = () => {
  const { users, addUser, updateUserStatus, businessProfile } = useApp();
  const isPharmacy = isPharmacyBusiness(businessProfile);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setFormError('');
    try {
      const created = await addUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'salesperson',
        avatarInitials: name.slice(0, 2).toUpperCase(),
        status: 'active',
      });
      setCreatedCredentials({
        name: created.user.name,
        email: created.user.email,
        password: created.temporaryPassword,
      });
      setName('');
      setEmail('');
      setIsAddDrawerOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create salesperson.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (userId: string, status: 'active' | 'suspended') => {
    setUpdatingId(userId);
    setStatusError('');
    try {
      await updateUserStatus(userId, status);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Unable to update salesperson status.');
    } finally {
      setUpdatingId('');
    }
  };

  const copyTemporaryPassword = async () => {
    if (!createdCredentials) return;
    setCopyError('');
    try {
      await navigator.clipboard.writeText(createdCredentials.password);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError('Clipboard access failed. Select and copy the password manually.');
    }
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
          className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 self-start"
        >
          <Plus size={16} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Role explanation banner */}
      <div className={`bg-[#FAF6EF] border border-[#EEE6DA] rounded-2xl p-4 grid grid-cols-1 ${isPharmacy ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 text-xs`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#EEE6DA] flex items-center justify-center text-[#7FAE82] shrink-0">
            <Shield size={16} />
          </div>
          <div>
            <div className="font-bold text-[#1C1B18]">{isPharmacy ? 'Pharmacy Owner' : 'Admin (Owner)'}</div>
            <p className="text-[#6B665E] mt-0.5 leading-relaxed">
              {isPharmacy
                ? 'Full administrative control, drug license compliance, distributor purchasing, profit margin reports, and store settings.'
                : 'Full unconstrained access to dashboard, products, stock adjustments, suppliers, purchase orders, financial reports, team, and settings.'}
            </p>
          </div>
        </div>

        {isPharmacy && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#EEE6DA] flex items-center justify-center text-[#2563EB] shrink-0">
              <UserCheck size={16} />
            </div>
            <div>
              <div className="font-bold text-[#1C1B18]">Pharmacist</div>
              <p className="text-[#6B665E] mt-0.5 leading-relaxed">
                Licensed drug dispensing, doctor prescription review, lot-wise batch management, and 30/60-day expiry radar.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#EEE6DA] flex items-center justify-center text-[#E8772E] shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <div className="font-bold text-[#1C1B18]">{isPharmacy ? 'Cashier' : 'Salesperson'}</div>
            <p className="text-[#6B665E] mt-0.5 leading-relaxed">
              {isPharmacy
                ? 'Rapid counter checkout, MRP-compliant billing, payment settlement (Cash, UPI, Card), and customer receipts.'
                : 'Restricted exclusively to POS terminal and own billing records. All back-office pages are hidden and blocked by security guards.'}
            </p>
          </div>
        </div>
      </div>

      {/* Team Grid View (Grid View only for both mobile & desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-2xl p-5 border border-[#EEE6DA] hover:border-[#DDD3C4] transition-all shadow-2xs flex flex-col justify-between"
          >
            <div>
              {/* Header: Avatar + Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 aspect-square shadow-2xs">
                  {u.avatarInitials}
                </div>
                <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                  {u.status === 'active' ? 'Active' : 'Suspended'}
                </Badge>
              </div>

              {/* Name & Role */}
              <div className="mt-3">
                <h4 className="font-bold text-[15px] text-[#1C1B18] tracking-tight">
                  {u.name}
                </h4>
                <div className="mt-1">
                  <Badge variant={u.role === 'admin' ? 'primary' : 'warning'}>
                    {u.role === 'admin' ? 'Owner / Admin' : 'Salesperson'}
                  </Badge>
                </div>
              </div>

              {/* Details: Email & Last Active */}
              <div className="mt-4 pt-3 border-t border-[#EEE6DA]/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#6B665E]">
                  <Mail size={13} className="text-[#9A948A] shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#9A948A] text-[11px]">
                  <Clock size={13} className="shrink-0" />
                  <span>Last active: {u.lastLogin}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-[#EEE6DA]">
              {u.role !== 'admin' ? (
                <button
                  type="button"
                  onClick={() => void handleStatusChange(
                    u.id,
                    u.status === 'active' ? 'suspended' : 'active'
                  )}
                  disabled={updatingId === u.id}
                  className={`w-full py-1.5 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    u.status === 'active'
                      ? 'border-[#FDECEC] bg-[#FDECEC]/60 text-[#D64545] hover:bg-[#FDECEC]'
                      : 'border-[#EEE6DA] bg-[#FAF6EF] text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF]/80'
                  }`}
                >
                  {updatingId === u.id ? 'Saving…' : u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                </button>
              ) : (
                <div className="w-full py-1.5 px-3 text-center text-xs text-[#9A948A] bg-[#FAF6EF]/70 rounded-xl border border-[#EEE6DA]/70 font-medium">
                  Primary Owner
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Drawer */}
      {statusError && <p className="text-sm text-red-700" role="alert">{statusError}</p>}
      {isAddDrawerOpen && (
        <Portal>
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
                      placeholder="deepak@Inventory.app"
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>

                  <p className="text-[#6B665E] leading-relaxed">
                    A secure temporary password will be generated automatically and shown once after creation.
                  </p>
                  {formError && <p className="text-red-700" role="alert">{formError}</p>}
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
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold"
                >
                  {creating ? 'Creating…' : 'Create Salesperson'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}
      {createdCredentials && (
        <Portal>
          <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/55 p-5">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="team-credential-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="team-credential-title" className="text-lg font-bold text-[#1C1B18]">Salesperson created</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#6B665E]">
                  Share this temporary password securely with {createdCredentials.name}. It will not be available again and must be changed at first sign-in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreatedCredentials(null);
                  setCopied(false);
                  setCopyError('');
                }}
                aria-label="Dismiss temporary password"
                className="rounded-lg p-1 text-[#6B665E] hover:bg-[#FAF6EF]"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm font-medium text-[#1C1B18]">{createdCredentials.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-[#F6F4F0] p-3 font-mono text-sm text-[#1C1B18]">
                {createdCredentials.password}
              </code>
              <button type="button" onClick={() => void copyTemporaryPassword()} className="rounded-lg border border-[#EEE6DA] p-3" aria-label="Copy temporary password">
                {copied ? <CheckCircle2 size={17} /> : <Copy size={17} />}
              </button>
            </div>
            {copied && <p className="mt-2 text-xs text-green-700" role="status">Temporary password copied.</p>}
            {copyError && <p className="mt-2 text-xs text-red-700" role="alert">{copyError}</p>}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCreatedCredentials(null);
                  setCopied(false);
                  setCopyError('');
                }}
                className="rounded-xl bg-[#7FAE82] px-4 py-2 text-xs font-semibold text-white"
              >
                Done and dismiss
              </button>
            </div>
          </section>
        </div>
        </Portal>
      )}
    </div>
  );
};
