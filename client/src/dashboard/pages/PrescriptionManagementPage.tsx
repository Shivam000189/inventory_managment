import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  UserCheck,
  Stethoscope,
  Phone,
  Calendar,
  ExternalLink,
  Printer,
  CheckCircle2,
  Clock,
  X,
  ShoppingCart,
  Pill,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { useApp } from '../context/AppContext';
import { prescriptionApi, Prescription, PrescriptionItem } from '../../api/prescriptionApi';

export const PrescriptionManagementPage: React.FC = () => {
  const { products, customers, navigate } = useApp();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Dispensed'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingRx, setViewingRx] = useState<Prescription | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState({
    doctorName: '',
    doctorRegNumber: '',
    hospitalName: '',
    patientName: '',
    patientPhone: '',
    patientAge: 32,
    patientGender: 'Male',
    prescriptionDate: new Date().toISOString().slice(0, 10),
    diagnosis: '',
    notes: '',
    items: [
      { medicineName: '', dosage: '1 tablet twice daily', frequency: 'Twice daily', duration: '5 days', quantity: 10 },
    ] as PrescriptionItem[],
  });

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await prescriptionApi.list();
      setPrescriptions(data);
    } catch {
      // Empty initial state
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const totalRx = prescriptions.length;
  const dispensedRx = prescriptions.filter((r) => r.status === 'Dispensed').length;
  const activeRx = prescriptions.filter((r) => r.status === 'Active').length;
  const uniqueDoctors = new Set(prescriptions.map((r) => r.doctorName)).size;

  const filteredRx = useMemo(() => {
    return prescriptions.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        r.prescriptionNumber.toLowerCase().includes(q) ||
        r.doctorName.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        (r.patientPhone && r.patientPhone.includes(q)) ||
        (r.doctorRegNumber && r.doctorRegNumber.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [prescriptions, searchQuery, statusFilter]);

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { medicineName: '', dosage: '1 tablet daily', frequency: 'Daily', duration: '5 days', quantity: 10 },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof PrescriptionItem, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleSaveRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorName || !formData.patientName) return;
    try {
      await prescriptionApi.create(formData);
      showToast('Prescription recorded successfully.');
      setIsAddModalOpen(false);
      loadPrescriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to record prescription');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1C1B18] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-[#7FAE82]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7FAE82] bg-[#E6F1E6] px-2.5 py-0.5 rounded-full">
              Regulated Dispensing
            </span>
            <span className="text-xs text-[#9A948A]">Doctor Rx & Patient Records</span>
          </div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight mt-1">
            Prescription Management
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Log medical prescriptions, record prescribing doctor credentials, and link prescriptions to counter sales.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/pos')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF6EF] text-[#1C1B18] border border-[#EEE6DA] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <ShoppingCart size={15} />
            <span>Open POS</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Prescription</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<FileText size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Registered Rx"
          value={totalRx}
          trend="Cumulative files"
          isPositive={true}
        />
        <StatCard
          icon={<CheckCircle2 size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF2FA] text-[#2563EB]"
          label="Dispensed Prescriptions"
          value={dispensedRx}
          trend="Fulfilled via POS"
          isPositive={true}
        />
        <StatCard
          icon={<Clock size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Active / Pending Rx"
          value={activeRx}
          trend="Ready to dispense"
          isPositive={true}
        />
        <StatCard
          icon={<Stethoscope size={18} strokeWidth={2} />}
          iconBgColor="bg-[#F3E8FF] text-[#7C3AED]"
          label="Prescribing Doctors"
          value={uniqueDoctors}
          trend="Registered clinicians"
          isPositive={true}
        />
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'Active', 'Dispensed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-[#381e12] text-white shadow-xs'
                    : 'bg-[#FAF6EF] text-[#6B665E] hover:bg-[#F4EDE2] hover:text-[#1C1B18]'
                }`}
              >
                {tab === 'all' ? 'All Prescriptions' : tab}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px] sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A948A]" />
            <input
              type="text"
              placeholder="Search doctor, patient, phone, Rx #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] bg-[#FAF6EF]/50 text-xs text-[#1C1B18] placeholder-[#9A948A] outline-none focus:border-[#7FAE82] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#EEE6DA]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF6EF]/60 text-[#6B665E] border-b border-[#EEE6DA]">
                <th className="py-3 px-3 font-semibold">Rx Number & Date</th>
                <th className="py-3 px-3 font-semibold">Prescribing Doctor</th>
                <th className="py-3 px-3 font-semibold">Patient Profile</th>
                <th className="py-3 px-3 font-semibold">Prescribed Medicines</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Linked Sale Order</th>
                <th className="py-3 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6DA]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9A948A]">
                    Loading prescription files…
                  </td>
                </tr>
              ) : filteredRx.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9A948A]">
                    No prescription records found. Click &quot;New Prescription&quot; to log your first Rx.
                  </td>
                </tr>
              ) : (
                filteredRx.map((rx) => (
                  <tr key={rx.id} className="hover:bg-[#FAF6EF]/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#1C1B18]">{rx.prescriptionNumber}</div>
                      <div className="text-[11px] text-[#6B665E]">
                        {new Date(rx.prescriptionDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#1C1B18] flex items-center gap-1.5">
                        <Stethoscope size={13} className="text-[#7FAE82]" />
                        <span>{rx.doctorName}</span>
                      </div>
                      {rx.doctorRegNumber && (
                        <div className="text-[10px] text-[#9A948A] font-mono">Reg: {rx.doctorRegNumber}</div>
                      )}
                      {rx.hospitalName && (
                        <div className="text-[10px] text-[#6B665E]">{rx.hospitalName}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#1C1B18]">{rx.patientName}</div>
                      <div className="text-[10px] text-[#6B665E] flex items-center gap-1">
                        {rx.patientAge && <span>{rx.patientAge}y • </span>}
                        {rx.patientGender && <span>{rx.patientGender} • </span>}
                        <span>{rx.patientPhone || 'Walk-in'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(rx.items || []).slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] bg-[#FAF6EF] border border-[#EEE6DA] px-2 py-0.5 rounded-md text-[#1C1B18]"
                          >
                            <Pill size={10} className="text-[#7FAE82]" />
                            <span>{item.medicineName}</span>
                          </span>
                        ))}
                        {(rx.items || []).length > 3 && (
                          <span className="text-[10px] text-[#9A948A] self-center">
                            +{rx.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          rx.status === 'Dispensed'
                            ? 'bg-[#E6F1E6] text-[#2E8B57]'
                            : 'bg-[#FFF4DC] text-[#D98E0B]'
                        }`}
                      >
                        {rx.status === 'Dispensed' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        <span>{rx.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {rx.salesOrderNumber ? (
                        <span className="font-mono text-xs text-[#2563EB] hover:underline cursor-pointer">
                          {rx.salesOrderNumber}
                        </span>
                      ) : (
                        <span className="text-[#9A948A] text-[11px]">— Not billed —</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setViewingRx(rx)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-[#EEE6DA] hover:bg-[#FAF6EF] text-[#1C1B18] text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        <FileText size={12} />
                        <span>View Rx</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Prescription Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EEE6DA] shadow-xl w-full max-w-2xl p-6 space-y-4 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-[#EEE6DA] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1C1B18]">New Doctor Prescription</h3>
                <p className="text-xs text-[#6B665E]">Record prescribing clinician details, patient info, and prescribed medicines.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRx} className="space-y-4">
              {/* Doctor Info */}
              <div className="bg-[#FAF6EF]/50 p-3.5 rounded-2xl border border-[#EEE6DA] space-y-3">
                <div className="text-xs font-bold text-[#1C1B18] uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope size={13} className="text-[#7FAE82]" />
                  <span>Prescribing Doctor Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Doctor Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. A. K. Sharma, MD"
                      value={formData.doctorName}
                      onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Medical Reg # (MCI / State)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MCI-28491"
                      value={formData.doctorRegNumber}
                      onChange={(e) => setFormData({ ...formData, doctorRegNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] font-mono text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Hospital / Clinic Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. City Care Hospital"
                      value={formData.hospitalName}
                      onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-[#FAF6EF]/50 p-3.5 rounded-2xl border border-[#EEE6DA] space-y-3">
                <div className="text-xs font-bold text-[#1C1B18] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={13} className="text-[#2563EB]" />
                  <span>Patient Profile</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Verma"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Patient Phone
                    </label>
                    <input
                      type="text"
                      placeholder="9876543210"
                      value={formData.patientPhone}
                      onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Rx Date
                    </label>
                    <input
                      type="date"
                      value={formData.prescriptionDate}
                      onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                </div>
              </div>

              {/* Prescribed Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1C1B18] uppercase tracking-wider">
                    Prescribed Medicines & Instructions
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-[#7FAE82] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Medicine Line</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 p-2.5 rounded-xl border border-[#EEE6DA] bg-white items-center text-xs"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Medicine name (e.g. Augmentin 625)"
                          value={item.medicineName}
                          onChange={(e) => handleItemChange(idx, 'medicineName', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#EEE6DA] outline-none focus:border-[#7FAE82]"
                          required
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 1 tab bid pc)"
                          value={item.dosage}
                          onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#EEE6DA] outline-none focus:border-[#7FAE82]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity || 10}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#EEE6DA] outline-none focus:border-[#7FAE82]"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-[#D64545] hover:bg-[#FDECEC] p-1 rounded-md"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  Diagnosis / Clinical Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Acute upper respiratory tract infection. Advised 5-day course."
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEE6DA]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EEE6DA] text-xs font-semibold text-[#6B665E] hover:bg-[#FAF6EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-white text-xs font-semibold shadow-xs"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Prescription Slip Modal */}
      {viewingRx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EEE6DA] shadow-xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EEE6DA] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#7FAE82] bg-[#E6F1E6] px-2 py-0.5 rounded-full">
                  {viewingRx.prescriptionNumber}
                </span>
                <h3 className="text-base font-bold text-[#1C1B18] mt-1">Medical Prescription Record</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl border border-[#EEE6DA] text-[#6B665E] hover:bg-[#FAF6EF] text-xs font-semibold flex items-center gap-1"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingRx(null)}
                  className="p-2 rounded-xl text-[#6B665E] hover:bg-[#FAF6EF]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Doctor Details */}
              <div className="border border-[#EEE6DA] p-3 rounded-2xl bg-[#FAF6EF]/40 space-y-1">
                <div className="text-[10px] text-[#9A948A] uppercase font-bold tracking-wider">Clinician</div>
                <div className="font-bold text-sm text-[#1C1B18]">{viewingRx.doctorName}</div>
                {viewingRx.doctorRegNumber && (
                  <div className="text-[#6B665E] font-mono">Reg No: {viewingRx.doctorRegNumber}</div>
                )}
                {viewingRx.hospitalName && <div className="text-[#6B665E]">{viewingRx.hospitalName}</div>}
              </div>

              {/* Patient Details */}
              <div className="border border-[#EEE6DA] p-3 rounded-2xl bg-[#FAF6EF]/40 space-y-1">
                <div className="text-[10px] text-[#9A948A] uppercase font-bold tracking-wider">Patient</div>
                <div className="font-bold text-[#1C1B18]">{viewingRx.patientName}</div>
                <div className="text-[#6B665E]">
                  {viewingRx.patientAge && `${viewingRx.patientAge} Yrs • `}
                  {viewingRx.patientGender && `${viewingRx.patientGender} • `}
                  {viewingRx.patientPhone || 'Walk-in customer'}
                </div>
                {viewingRx.diagnosis && (
                  <div className="text-[#7FAE82] font-medium pt-1">Diagnosis: {viewingRx.diagnosis}</div>
                )}
              </div>

              {/* Rx Items Table */}
              <div>
                <div className="font-bold text-[#1C1B18] mb-1.5">Prescribed Medicines (Rx):</div>
                <div className="rounded-xl border border-[#EEE6DA] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF6EF] text-[#6B665E]">
                      <tr>
                        <th className="py-2 px-3">Medicine</th>
                        <th className="py-2 px-3">Dosage / Schedule</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEE6DA]">
                      {(viewingRx.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-[#1C1B18]">{it.medicineName}</td>
                          <td className="py-2 px-3 text-[#6B665E]">{it.dosage || '—'}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#1C1B18]">{it.quantity || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEE6DA]">
              <button
                type="button"
                onClick={() => setViewingRx(null)}
                className="px-4 py-2 rounded-xl border border-[#EEE6DA] text-xs font-semibold text-[#6B665E] hover:bg-[#FAF6EF]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingRx(null);
                  navigate('/pos');
                }}
                className="px-4 py-2 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <ShoppingCart size={14} />
                <span>Dispense at POS Counter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionManagementPage;

