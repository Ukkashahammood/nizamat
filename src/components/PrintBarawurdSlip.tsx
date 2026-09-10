import React from 'react';
import { BillRecord } from '../types';
import { formatCurrency, formatNumber, numberToIndianWords } from '../utils/formatters';
import { Printer, ArrowLeft, CheckCircle2, Building2, Calendar, Clock, User, FileText } from 'lucide-react';

interface PrintBarawurdSlipProps {
  bill: BillRecord;
  onClose: () => void;
}

export const PrintBarawurdSlip: React.FC<PrintBarawurdSlipProps> = ({ bill, onClose }) => {
  const verifiedAmt = bill.verifiedAmount ?? bill.estimateAmount;
  const discrepancy = bill.estimateAmount - verifiedAmt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-2 sm:p-4">
      {/* Container */}
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden print-container border border-slate-200">
        
        {/* Action Header - Hidden on Print */}
        <div className="no-print bg-slate-800 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-semibold text-base sm:text-lg">Bar’awurd (برآورد) Verification & Payment Slip</h3>
              <p className="text-xs text-slate-300">Reference: {bill.barawurdNo} • Department: {bill.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Out &amp; Sign</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 sm:p-10 text-slate-900 bg-white font-serif">
          
          {/* Institution Official Header */}
          <div className="text-center border-b-2 border-slate-800 pb-5 mb-6">
            <div className="text-xs font-sans tracking-widest text-slate-500 uppercase font-semibold">
              ACCOUNTS &amp; AUDIT VERIFICATION DEPARTMENT
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              DARUL ULOOM NADWATUL ULAMA
            </h1>
            <h2 className="text-base sm:text-lg font-semibold text-slate-700 mt-0.5">
              BAR’AWURD ESTIMATE &amp; BILL VERIFICATION SLIP
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-1">
              (Front-Page Summary &amp; Supporting Vouchers Audit Endorsement)
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg border border-slate-300 font-sans text-xs sm:text-sm bg-slate-50 mb-6">
            <div>
              <span className="text-slate-500 block text-xs">Bar’awurd No:</span>
              <span className="font-bold text-slate-900">{bill.barawurdNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Date &amp; Time:</span>
              <span className="font-semibold text-slate-900">{bill.receivedDate} at {bill.receivedTime}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Department:</span>
              <span className="font-bold text-emerald-800">{bill.department}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Brought By:</span>
              <span className="font-semibold text-slate-900">{bill.broughtBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Received By:</span>
              <span className="font-semibold text-slate-900">{bill.receivedBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Vouchers Count:</span>
              <span className="font-semibold text-slate-900">{bill.supportingVouchers.length} Attachments</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block text-xs">Initial Description / Purpose:</span>
              <span className="font-medium text-slate-800">{bill.initialDescription}</span>
            </div>
          </div>

          {/* Vouchers Breakdown Table */}
          <div className="mb-6 font-sans">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-2 border-b pb-1">
              Itemized Supporting Vouchers / Bills Audit
            </h3>
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 text-left font-semibold text-slate-700">
                  <th className="py-2 px-3 w-12 text-center">S#</th>
                  <th className="py-2 px-3">Voucher #</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Vendor / Payee</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                  <th className="py-2 px-3 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bill.supportingVouchers.map((v, i) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-center text-slate-500">{i + 1}</td>
                    <td className="py-2 px-3 font-mono font-medium">{v.voucherNo}</td>
                    <td className="py-2 px-3 text-slate-600">{v.date}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{v.vendorOrPerson}</td>
                    <td className="py-2 px-3 text-slate-700">{v.description}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatNumber(v.amount)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 font-semibold">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                  <td colSpan={5} className="py-2 px-3 text-right text-slate-700">
                    Sum of Supporting Vouchers:
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900 font-bold">
                    {formatCurrency(bill.supportingVouchers.reduce((s, v) => s + v.amount, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Financial Summary & Bar'awurd Reconciliation Box */}
          <div className="border-2 border-slate-700 rounded-lg p-4 font-sans bg-slate-50/50 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center border-b border-slate-300 pb-3 mb-3">
              <div>
                <span className="text-xs text-slate-500 uppercase">Front Page Estimate (Bar’awurd)</span>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(bill.estimateAmount)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Audit Adjustments / Deductions</span>
                <p className="text-xl font-bold text-rose-700">
                  {discrepancy > 0 ? `-${formatCurrency(discrepancy)}` : 'NIL (₹0)'}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Final Verified Amount For Payment</span>
                <p className="text-2xl font-black text-emerald-800">{formatCurrency(verifiedAmt)}</p>
              </div>
            </div>

            <div className="text-xs text-slate-700">
              <span className="font-bold">Amount in Words: </span>
              <span className="italic font-serif text-sm font-semibold">{numberToIndianWords(verifiedAmt)}</span>
            </div>

            {bill.verificationNotes && (
              <div className="mt-2 text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                <span className="font-bold text-slate-800">Verification Officer Remarks: </span>
                {bill.verificationNotes}
              </div>
            )}
          </div>

          {/* Official Sign-off & Passing to Payment Certificate */}
          <div className="mt-8 font-sans">
            <p className="text-xs text-slate-600 italic mb-10 text-center">
              "Certified that all attached vouchers and bills have been examined, arithmetically checked, and found in order with appropriate authorizations. Passed forward to Central Accounts for final disbursement."
            </p>

            <div className="grid grid-cols-3 gap-8 text-center pt-8 border-t border-slate-300">
              <div>
                <div className="h-14 border-b border-dashed border-slate-400"></div>
                <p className="text-xs font-bold text-slate-800 mt-1">{bill.broughtBy}</p>
                <p className="text-[11px] text-slate-500">Department Representative / Prepared By</p>
              </div>
              <div>
                <div className="h-14 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                  <span className="text-xs font-semibold text-emerald-800 font-sans tracking-wide">
                    ✓ {bill.verifiedByOfficer || 'Verified & Passed'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {bill.verifiedByOfficer || 'Verification Officer'}
                </p>
                <p className="text-[11px] text-slate-500">Audited &amp; Verified By (Signature &amp; Stamp)</p>
              </div>
              <div>
                <div className="h-14 border-b border-dashed border-slate-400"></div>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {bill.forwardingDepartment || 'Central Treasury / Nazir'}
                </p>
                <p className="text-[11px] text-slate-500">Sanctioning Authority / Final Payment Approval</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
