import React, { useState, useMemo } from 'react';
import { BillRecord, DEPARTMENTS, BillStatus } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { 
  Plus, Search, Filter, Printer, ShieldCheck, CheckCircle2, 
  Clock, ArrowRight, Building2, SendHorizontal, AlertCircle, 
  FileSpreadsheet, Eye, FileText
} from 'lucide-react';

interface BillPipelineViewProps {
  bills: BillRecord[];
  onOpenReceiveModal: () => void;
  onOpenVerifyModal: (bill: BillRecord) => void;
  onOpenPrintSlip: (bill: BillRecord) => void;
  onQuickPassForPayment: (bill: BillRecord) => void;
}

export const BillPipelineView: React.FC<BillPipelineViewProps> = ({
  bills,
  onOpenReceiveModal,
  onOpenVerifyModal,
  onOpenPrintSlip,
  onQuickPassForPayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = b.barawurdNo.toLowerCase().includes(q);
        const matchesDept = b.department.toLowerCase().includes(q);
        const matchesBrought = b.broughtBy.toLowerCase().includes(q);
        const matchesDesc = b.initialDescription.toLowerCase().includes(q);
        if (!matchesRef && !matchesDept && !matchesBrought && !matchesDesc) {
          return false;
        }
      }

      if (selectedDept !== 'ALL' && b.department !== selectedDept) {
        return false;
      }

      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [bills, searchQuery, selectedDept, statusFilter]);

  // Summary Metrics
  const countReceived = bills.filter(b => b.status === 'received').length;
  const countInVerification = bills.filter(b => b.status === 'in_verification').length;
  const countVerified = bills.filter(b => b.status === 'verified').length;
  const countPassedForPayment = bills.filter(b => b.status === 'passed_for_payment').length;
  const totalEstimatedValue = bills.reduce((s, b) => s + b.estimateAmount, 0);
  const totalVerifiedValue = bills.reduce((s, b) => s + (b.verifiedAmount ?? b.estimateAmount), 0);

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            Received (Step 1)
          </span>
        );
      case 'in_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3 h-3" />
            In Verification (Step 2)
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Verified &amp; Approved
          </span>
        );
      case 'passed_for_payment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <SendHorizontal className="w-3 h-3" />
            Passed for Payment (Step 3)
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            Paid &amp; Settled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Action Button */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Bill &amp; Bar’awurd (برآورد) Verification Desk</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Department Bills &amp; Payment Pipeline</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            1. Log bill brought from department • 2. Check front estimate against supporting vouchers • 3. Pass forward to Central Accounts for payment.
          </p>
        </div>

        <button
          onClick={onOpenReceiveModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Receive New Bill &amp; Bar'awurd</span>
        </button>
      </div>

      {/* 3-Step Visual Process Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Step 1: Newly Received
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{countReceived}</p>
          <span className="text-[11px] text-slate-500">Awaiting audit &amp; voucher check</span>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
              Step 2: In Verification
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{countInVerification + countVerified}</p>
          <span className="text-[11px] text-blue-700">Checking vouchers &amp; Bar'awurd totals</span>
        </div>

        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
              Step 3: Passed for Payment
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-1">{countPassedForPayment}</p>
          <span className="text-[11px] text-purple-700">Forwarded with endorsement slip</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
            Verified Value
          </span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(totalVerifiedValue)}</p>
          <span className="text-[11px] text-emerald-700">Total audited expenditures</span>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Bar'awurd Ref, Department, Brought By..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none max-w-xs truncate"
            >
              <option value="ALL">All Departments ({DEPARTMENTS.length})</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="received">Received</option>
              <option value="in_verification">In Verification</option>
              <option value="verified">Verified</option>
              <option value="passed_for_payment">Passed for Payment</option>
            </select>
          </div>

        </div>
      </div>

      {/* Bills Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Incoming Bills &amp; Bar’awurd Records ({filteredBills.length})
          </h3>
          <span className="text-xs text-slate-500">
            Showing records across 22 recognized institutional wings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-4">Bar’awurd No</th>
                <th className="py-3 px-4">Received Date &amp; Time</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Brought By / Person</th>
                <th className="py-3 px-4">Initial Description</th>
                <th className="py-3 px-4 text-right">Estimate (₹)</th>
                <th className="py-3 px-4 text-center">Vouchers</th>
                <th className="py-3 px-4 text-center">Pipeline Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No bill records found for this filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "+ Receive New Bill &amp; Bar'awurd" above to log a new bill.</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill, idx) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                    
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {bill.barawurdNo}
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div>{bill.receivedDate}</div>
                      <div className="text-[10px] text-slate-400">{bill.receivedTime}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{bill.department}</span>
                      <span className="text-[10px] text-slate-500">Recv: {bill.receivedBy}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{bill.broughtBy}</span>
                      {bill.broughtByContact && (
                        <div className="text-[10px] text-slate-400">{bill.broughtByContact}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {bill.initialDescription}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">{formatCurrency(bill.estimateAmount)}</div>
                      {bill.verifiedAmount !== undefined && bill.verifiedAmount !== bill.estimateAmount && (
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Audited: {formatCurrency(bill.verifiedAmount)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                        {bill.supportingVouchers.length} bills
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(bill.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Verify button */}
                        <button
                          onClick={() => onOpenVerifyModal(bill)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                          title="Open Check & Verify Workspace"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verify</span>
                        </button>

                        {/* Print Slip */}
                        <button
                          onClick={() => onOpenPrintSlip(bill)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                          title="Print Bar'awurd Slip & Sign"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        {/* Quick Pass for payment */}
                        {bill.status !== 'passed_for_payment' && (
                          <button
                            onClick={() => onQuickPassForPayment(bill)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors"
                            title="Quick Pass Forward to Payment"
                          >
                            <SendHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
