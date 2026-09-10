import React, { useState } from 'react';
import { BillRecord, SupportingVoucher, BillStatus } from '../types';
import { formatCurrency, numberToIndianWords } from '../utils/formatters';
import { 
  X, CheckCircle, AlertTriangle, Printer, ArrowRight, 
  ShieldCheck, FileCheck, Building2, Calendar, Clock, User, 
  SendHorizontal, CheckSquare, Square
} from 'lucide-react';

interface BillVerificationModalProps {
  bill: BillRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBill: (updated: BillRecord) => void;
  onOpenPrint: (bill: BillRecord) => void;
}

export const BillVerificationModal: React.FC<BillVerificationModalProps> = ({
  bill,
  isOpen,
  onClose,
  onUpdateBill,
  onOpenPrint,
}) => {
  const [vouchers, setVouchers] = useState<SupportingVoucher[]>(bill.supportingVouchers || []);
  const [verifiedAmount, setVerifiedAmount] = useState<string>(
    bill.verifiedAmount !== undefined ? String(bill.verifiedAmount) : String(bill.estimateAmount)
  );
  const [verificationNotes, setVerificationNotes] = useState<string>(bill.verificationNotes || '');
  const [officerName, setOfficerName] = useState<string>(bill.verifiedByOfficer || 'Accounts Verifier');
  const [forwardingDept, setForwardingDept] = useState<string>(bill.forwardingDepartment || 'Central Accounts & Treasury');
  const [status, setStatus] = useState<BillStatus>(bill.status);

  // Verification Checklist
  const [checks, setChecks] = useState({
    arithmeticMatched: true,
    vouchersAttached: true,
    signaturesValid: true,
    noDuplicates: true,
  });

  if (!isOpen) return null;

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleVoucherStatus = (id: string) => {
    setVouchers(prev =>
      prev.map(v => {
        if (v.id === id) {
          const nextStatus = v.status === 'checked' ? 'flagged' : 'checked';
          return { ...v, status: nextStatus };
        }
        return v;
      })
    );
  };

  const voucherTotal = vouchers.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
  const numericVerifiedAmt = parseFloat(verifiedAmount) || 0;
  const variance = bill.estimateAmount - numericVerifiedAmt;

  const handleSaveVerification = (newStatus: BillStatus) => {
    const updated: BillRecord = {
      ...bill,
      supportingVouchers: vouchers,
      verifiedAmount: numericVerifiedAmt,
      verificationNotes,
      verifiedByOfficer: officerName,
      verifiedAt: new Date().toLocaleString('en-GB'),
      status: newStatus,
      forwardingDepartment: forwardingDept,
      passedToPaymentBy: newStatus === 'passed_for_payment' ? officerName : bill.passedToPaymentBy,
      passedToPaymentAt: newStatus === 'passed_for_payment' ? new Date().toLocaleString('en-GB') : bill.passedToPaymentAt,
    };

    onUpdateBill(updated);
    setStatus(newStatus);
  };

  const handlePassForPayment = () => {
    handleSaveVerification('passed_for_payment');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Check &amp; Verify Bill: {bill.barawurdNo}</h2>
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold uppercase ${
                  status === 'passed_for_payment'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : status === 'verified'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300">Department: {bill.department} • Brought by: {bill.broughtBy}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrint(bill)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              title="Print Bar'awurd Slip"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Key Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Front-Page Estimate (Bar’awurd)
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(bill.estimateAmount)}
              </p>
              <span className="text-[11px] text-slate-500">
                Submitted by {bill.broughtBy}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Vouchers Sum ({vouchers.length} items)
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(voucherTotal)}
              </p>
              <span className={`text-[11px] font-medium ${Math.abs(bill.estimateAmount - voucherTotal) < 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {Math.abs(bill.estimateAmount - voucherTotal) < 1 ? '✓ Arithmetically matched' : `Difference: ${formatCurrency(bill.estimateAmount - voucherTotal)}`}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Final Verified Amount
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-emerald-900">₹</span>
                <input
                  type="number"
                  value={verifiedAmount}
                  onChange={(e) => setVerifiedAmount(e.target.value)}
                  className="w-full text-xl font-black text-emerald-900 bg-white border border-emerald-400 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[11px] text-emerald-700 block mt-1">
                {numberToIndianWords(numericVerifiedAmt)}
              </span>
            </div>
          </div>

          {/* Audit Checklist */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Step 2: Verification Checklist &amp; Internal Audit</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label 
                onClick={() => toggleCheck('arithmeticMatched')}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-emerald-400 select-none"
              >
                {checks.arithmeticMatched ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={checks.arithmeticMatched ? 'font-medium text-slate-900' : 'text-slate-600'}>
                  1. Arithmetic sum of vouchers matches front estimate
                </span>
              </label>

              <label 
                onClick={() => toggleCheck('vouchersAttached')}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-emerald-400 select-none"
              >
                {checks.vouchersAttached ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={checks.vouchersAttached ? 'font-medium text-slate-900' : 'text-slate-600'}>
                  2. All original supplier bills/cash memos attached
                </span>
              </label>

              <label 
                onClick={() => toggleCheck('signaturesValid')}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-emerald-400 select-none"
              >
                {checks.signaturesValid ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={checks.signaturesValid ? 'font-medium text-slate-900' : 'text-slate-600'}>
                  3. Department Incharge stamp and signature verified
                </span>
              </label>

              <label 
                onClick={() => toggleCheck('noDuplicates')}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-emerald-400 select-none"
              >
                {checks.noDuplicates ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={checks.noDuplicates ? 'font-medium text-slate-900' : 'text-slate-600'}>
                  4. No duplicate bill or previous double-claim detected
                </span>
              </label>
            </div>
          </div>

          {/* Vouchers Inspection Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Supporting Vouchers ({vouchers.length}) - Click Status to Toggle Checked / Flagged
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Total: {formatCurrency(voucherTotal)}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Voucher #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Vendor / Payee</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {vouchers.map((v, i) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-2 px-3 font-mono font-medium">{v.voucherNo}</td>
                      <td className="py-2 px-3 text-slate-600">{v.date}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{v.vendorOrPerson}</td>
                      <td className="py-2 px-3 text-slate-700">{v.description}</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatCurrency(v.amount)}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleVoucherStatus(v.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            v.status === 'checked'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : v.status === 'flagged'
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {v.status === 'checked' ? '✓ Verified' : v.status === 'flagged' ? '⚠ Flagged' : 'Pending'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Officer Sign-off & Forwarding Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Officer Name
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="e.g. Accounts Verifier"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Forward To (Payment Authority)
              </label>
              <select
                value={forwardingDept}
                onChange={(e) => setForwardingDept(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Central Accounts & Treasury">Central Accounts &amp; Treasury</option>
                <option value="Nazir / Administrative Secretary">Nazir / Administrative Secretary</option>
                <option value="Chief Accountant & Cashier">Chief Accountant &amp; Cashier</option>
                <option value="Bank Transfer & RTGS Desk">Bank Transfer &amp; RTGS Desk</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Notes / Audit Remarks / Deductions Justification
              </label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Enter notes on voucher verification, any discount deduction adjustments, or remarks for the payment sanctioning authority..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onOpenPrint(bill)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Generate Printable Slip</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSaveVerification('verified')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Save as Verified
            </button>
            <button
              onClick={handlePassForPayment}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Pass to Next for Payment</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
