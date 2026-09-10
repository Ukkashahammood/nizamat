import React, { useState } from 'react';
import { BillRecord, DEPARTMENTS, DepartmentName, SupportingVoucher } from '../types';
import { formatCurrency } from '../utils/formatters';
import { X, Plus, Trash2, AlertCircle, CheckCircle, FileSpreadsheet, Building } from 'lucide-react';

interface BillReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newBill: BillRecord) => void;
}

export const BillReceiveModal: React.FC<BillReceiveModalProps> = ({ isOpen, onClose, onSave }) => {
  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 10);
  const defaultTime = now.toTimeString().slice(0, 5);

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [department, setDepartment] = useState<DepartmentName>('DARUL ULOOM');
  const [customDept, setCustomDept] = useState('');
  const [broughtBy, setBroughtBy] = useState('');
  const [broughtByContact, setBroughtByContact] = useState('');
  const [receivedBy, setReceivedBy] = useState('Verification Officer');
  const [initialDescription, setInitialDescription] = useState('');
  const [estimateAmount, setEstimateAmount] = useState<string>('');
  const [barawurdNo, setBarawurdNo] = useState(`BAR-${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`);

  // Supporting vouchers
  const [vouchers, setVouchers] = useState<SupportingVoucher[]>([
    {
      id: 'v-new-1',
      voucherNo: 'V-001',
      date: defaultDate,
      vendorOrPerson: '',
      description: '',
      amount: 0,
      status: 'pending',
    },
  ]);

  if (!isOpen) return null;

  const handleAddVoucher = () => {
    setVouchers([
      ...vouchers,
      {
        id: `v-new-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        voucherNo: `V-${String(vouchers.length + 1).padStart(3, '0')}`,
        date,
        vendorOrPerson: '',
        description: '',
        amount: 0,
        status: 'pending',
      },
    ]);
  };

  const handleRemoveVoucher = (id: string) => {
    if (vouchers.length > 1) {
      setVouchers(vouchers.filter(v => v.id !== id));
    }
  };

  const handleUpdateVoucher = (id: string, field: keyof SupportingVoucher, value: any) => {
    setVouchers(vouchers.map(v => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const totalVouchersAmount = vouchers.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
  const parsedEstimate = parseFloat(estimateAmount) || 0;
  const difference = parsedEstimate - totalVouchersAmount;
  const isMatch = parsedEstimate > 0 && Math.abs(difference) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broughtBy.trim()) {
      alert('Please enter who brought the bill.');
      return;
    }
    if (parsedEstimate <= 0) {
      alert('Please enter the front-page Bar’awurd estimate amount.');
      return;
    }

    const newBill: BillRecord = {
      id: `bill-${Date.now()}`,
      barawurdNo: barawurdNo.trim() || `BAR-${Date.now()}`,
      receivedDate: date,
      receivedTime: time,
      department: department === 'CUSTOM' ? (customDept.trim() || 'CUSTOM DEPT') : department,
      customDepartmentName: department === 'CUSTOM' ? customDept : undefined,
      broughtBy: broughtBy.trim(),
      broughtByContact: broughtByContact.trim() || undefined,
      receivedBy: receivedBy.trim() || 'Verification Desk',
      initialDescription: initialDescription.trim() || 'Bill estimate with attached vouchers',
      estimateAmount: parsedEstimate,
      verifiedAmount: undefined,
      status: 'received',
      supportingVouchers: vouchers.filter(v => (Number(v.amount) || 0) > 0 || v.vendorOrPerson),
    };

    onSave(newBill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Log Received Bill &amp; Bar’awurd (برآورد)</h2>
              <p className="text-xs text-slate-300">Step 1: Record incoming estimate front-page and supporting vouchers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Reception Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Reception &amp; Department Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Received Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Received Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Bar'awurd Estimate No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bar’awurd / Ref No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={barawurdNo}
                  onChange={(e) => setBarawurdNo(e.target.value)}
                  placeholder="e.g. BAR-2026/09-045"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Department Dropdown */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Department <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-500 font-normal">21 Recognized + Custom</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as DepartmentName)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-800"
                >
                  {DEPARTMENTS.map((dept, index) => (
                    <option key={dept} value={dept}>
                      {index + 1}. {dept}
                    </option>
                  ))}
                </select>

                {department === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    placeholder="Type custom department name..."
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    className="mt-2 w-full px-3 py-2 text-sm border border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/40"
                  />
                )}
              </div>

              {/* Received By */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Received By (Verifier) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Officer name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Brought By */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brought By (Person Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={broughtBy}
                  onChange={(e) => setBroughtBy(e.target.value)}
                  placeholder="e.g. Shabbir Ahmad, Storekeeper"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Contact / Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone / Designation
                </label>
                <input
                  type="text"
                  value={broughtByContact}
                  onChange={(e) => setBroughtByContact(e.target.value)}
                  placeholder="Mobile / Designation"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Front Page Bar'awurd Estimate Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Front Page Estimate (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={estimateAmount}
                    onChange={(e) => setEstimateAmount(e.target.value)}
                    placeholder="Total Estimate on Bar’awurd"
                    className="w-full pl-8 pr-3 py-2 text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Description / Subject
              </label>
              <textarea
                rows={2}
                value={initialDescription}
                onChange={(e) => setInitialDescription(e.target.value)}
                placeholder="Brief summary of bill items (e.g. Monthly provision supplies, plumbing repairs, library binding)..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Supporting Vouchers / Bills Breakdown */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Supporting Vouchers &amp; Bills ({vouchers.length})
                </h3>
                <p className="text-xs text-slate-500">List individual receipts attached behind the front-page Bar'awurd</p>
              </div>

              <button
                type="button"
                onClick={handleAddVoucher}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Voucher
              </button>
            </div>

            {/* Vouchers Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50/50">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">Voucher #</th>
                    <th className="py-2.5 px-3 w-32">Date</th>
                    <th className="py-2.5 px-3 w-48">Vendor / Person</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {vouchers.map((voucher, idx) => (
                    <tr key={voucher.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={voucher.voucherNo}
                          onChange={(e) => handleUpdateVoucher(voucher.id, 'voucherNo', e.target.value)}
                          placeholder="V-001"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="date"
                          value={voucher.date}
                          onChange={(e) => handleUpdateVoucher(voucher.id, 'date', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={voucher.vendorOrPerson}
                          onChange={(e) => handleUpdateVoucher(voucher.id, 'vendorOrPerson', e.target.value)}
                          placeholder="Vendor or shop name"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={voucher.description}
                          onChange={(e) => handleUpdateVoucher(voucher.id, 'description', e.target.value)}
                          placeholder="Particulars of item/service"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={voucher.amount || ''}
                          onChange={(e) => handleUpdateVoucher(voucher.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2 py-1 text-xs font-semibold text-right border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        {vouchers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVoucher(voucher.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reconciliation Comparison Footer */}
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[11px] text-slate-500 block">Front Estimate:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(parsedEstimate)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Sum of Vouchers:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(totalVouchersAmount)}
                  </span>
                </div>
              </div>

              <div>
                {parsedEstimate > 0 && (
                  isMatch ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-3 py-1.5 rounded-lg font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Perfect Match: Supporting vouchers sum equals front estimate</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/70 border border-amber-300 px-3 py-1.5 rounded-lg font-medium">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>
                        Difference of {formatCurrency(Math.abs(difference))} ({difference > 0 ? 'Shortfall in vouchers' : 'Vouchers exceed estimate'}). You can audit and adjust during verification.
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-200 pt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Save Received Bill
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
