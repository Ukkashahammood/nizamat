import React, { useState } from 'react';
import { BankTransaction, Representative } from '../types';
import { formatCurrency, formatNumber, numberToIndianWords, exportToExcel } from '../utils/formatters';
import { 
  Printer, Download, ArrowLeft, Award, CheckCircle2, 
  Calendar, ShieldCheck, UserCheck, FileSpreadsheet, Building2, SlidersHorizontal
} from 'lucide-react';

interface RepresentativeRewardSheetProps {
  representative: Representative;
  transactions: BankTransaction[];
  onClose: () => void;
  onMarkAllSigned?: (txnIds: string[]) => void;
}

export const RepresentativeRewardSheet: React.FC<RepresentativeRewardSheetProps> = ({
  representative,
  transactions,
  onClose,
  onMarkAllSigned,
}) => {
  // Reward settings
  const [rewardType, setRewardType] = useState<'percent' | 'fixed'>('percent');
  const [rewardPercent, setRewardPercent] = useState<number>(5); // default 5%
  const [fixedRewardAmount, setFixedRewardAmount] = useState<number>(0);
  const [authorityTitle, setAuthorityTitle] = useState('Nazir / General Secretary');
  const [statementPeriod, setStatementPeriod] = useState(
    `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`
  );
  const [verificationOfficer, setVerificationOfficer] = useState('Verification Officer (Accounts)');
  const [showSettings, setShowSettings] = useState(false);

  const totalAmount = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const calculatedReward = rewardType === 'percent'
    ? Math.round((totalAmount * rewardPercent) / 100)
    : fixedRewardAmount;

  // Breakdown by Bank & Account
  const bankBreakdown = transactions.reduce((acc, t) => {
    const key = `${t.bank} - ${t.subAccount}`;
    acc[key] = (acc[key] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const cleanRepName = representative.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    exportToExcel(
      transactions,
      `Reward_Sheet_${cleanRepName}_${new Date().toISOString().slice(0, 10)}`,
      representative.name.substring(0, 31)
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden print-container border border-slate-200">
        
        {/* Top Control Bar - Hidden on Print */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">Representative Reward &amp; Verification Sheet</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                  Filtered Sheet ({transactions.length} Txns)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Representative: <strong className="text-slate-200">{representative.name}</strong> • Region: {representative.region || 'General Area'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Reward Settings</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sheet (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Out &amp; Sign</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Optional Reward Settings Drawer (Hidden on Print) */}
        {showSettings && (
          <div className="no-print bg-slate-50 border-b border-slate-200 p-4 font-sans text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reward Type</label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="percent">Percentage of Collection (%)</option>
                  <option value="fixed">Fixed Reward Amount (₹)</option>
                </select>
              </div>

              {rewardType === 'percent' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reward Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={rewardPercent}
                    onChange={(e) => setRewardPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fixed Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={fixedRewardAmount}
                    onChange={(e) => setFixedRewardAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sanctioning Authority Title</label>
                <input
                  type="text"
                  value={authorityTitle}
                  onChange={(e) => setAuthorityTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statement Period</label>
                <input
                  type="text"
                  value={statementPeriod}
                  onChange={(e) => setStatementPeriod(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Printable Document Area */}
        <div className="p-8 sm:p-10 text-slate-900 bg-white font-serif">
          
          {/* Official Letterhead Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <div className="text-xs font-sans tracking-widest text-slate-500 uppercase font-semibold">
              ACCOUNTS &amp; VERIFICATION WING
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              DARUL ULOOM NADWATUL ULAMA
            </h1>
            <h2 className="text-base sm:text-lg font-semibold text-slate-700 mt-0.5">
              REPRESENTATIVE BANK DONATION VERIFICATION &amp; REWARD ENDORSEMENT SHEET
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-1">
              (Net Banking Statement Reconciliation Verified Against Donors &amp; Representative Claims)
            </p>
          </div>

          {/* Representative & Batch Details Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg border border-slate-300 font-sans text-xs sm:text-sm bg-slate-50 mb-6">
            <div>
              <span className="text-slate-500 block text-xs">Representative Name:</span>
              <span className="font-bold text-slate-900 text-sm">{representative.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Assigned Tour / Region:</span>
              <span className="font-semibold text-slate-900">{representative.region || 'Assigned Area'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Statement Period:</span>
              <span className="font-semibold text-slate-900">{statementPeriod}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Verified Date:</span>
              <span className="font-semibold text-slate-900">{new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* Bank Accounts Distribution Summary */}
          <div className="mb-6 font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Bank &amp; Account Breakdown (SBI / HDFC / IDBI)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {(Object.entries(bankBreakdown) as [string, number][]).map(([bankAccount, amount]) => (
                <div key={bankAccount} className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[11px] text-slate-500 font-medium block truncate">{bankAccount}</span>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Itemized Bank Transactions Table */}
          <div className="mb-6 font-sans">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Verified Bank Transactions Extracted from Net Banking Statement ({transactions.length})
              </h3>
              <span className="text-xs text-slate-500">Extra Column: Representative tagged</span>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 text-left font-semibold text-slate-700">
                  <th className="py-2 px-2.5 w-10 text-center">#</th>
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Bank &amp; Account</th>
                  <th className="py-2 px-2.5">Transaction ID / UTR</th>
                  <th className="py-2 px-2.5">Donor / Narration</th>
                  <th className="py-2 px-2.5 text-right">Amount (₹)</th>
                  <th className="py-2 px-2.5 text-center">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2.5 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-2.5 text-slate-700 whitespace-nowrap">{t.date}</td>
                    <td className="py-2 px-2.5 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold mr-1">
                        {t.bank}
                      </span>
                      <span className="text-slate-600 text-[11px]">{t.subAccount}</span>
                    </td>
                    <td className="py-2 px-2.5 font-mono text-slate-800">{t.transactionId}</td>
                    <td className="py-2 px-2.5 text-slate-700 max-w-xs">
                      {t.donorName ? (
                        <div>
                          <strong className="text-slate-900">{t.donorName}</strong>
                          {t.donorCity && <span className="text-slate-500"> ({t.donorCity})</span>}
                          <div className="text-[10px] text-slate-400 truncate">{t.narration}</div>
                        </div>
                      ) : (
                        <div className="truncate">{t.narration}</div>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                      {formatNumber(t.amount)}
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <span className="text-emerald-700 text-[11px] font-semibold">
                        ✓ Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-400 bg-slate-50 font-semibold text-sm">
                  <td colSpan={5} className="py-2.5 px-3 text-right text-slate-700">
                    Grand Total Verified Collection:
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900 font-bold text-base">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Reward Calculation & Sanction Box */}
          <div className="border-2 border-slate-700 rounded-lg p-4 font-sans bg-slate-50/50 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center border-b border-slate-300 pb-3 mb-3">
              <div>
                <span className="text-xs text-slate-500 uppercase">Total Verified Collection</span>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">
                  Reward Basis ({rewardType === 'percent' ? `${rewardPercent}% Collection Reward` : 'Fixed Reward'})
                </span>
                <p className="text-xl font-bold text-indigo-700">
                  {formatCurrency(calculatedReward)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Sanction Recommendation</span>
                <p className="text-xl font-black text-emerald-800">
                  {formatCurrency(calculatedReward)}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-700">
              <span className="font-bold">Total Collection in Words: </span>
              <span className="italic font-serif text-sm font-semibold">{numberToIndianWords(totalAmount)}</span>
            </div>

            <div className="mt-2 text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200">
              <strong>Audit Certificate: </strong>
              I have checked and verified each transaction ID and screenshot provided by Representative <strong>{representative.name}</strong> against our Net Banking statements (SBI, HDFC, IDBI). The amounts above have successfully credited into our institutional accounts. Passed to {authorityTitle} for approving reward as per prescribed norms.
            </div>
          </div>

          {/* Signature & Endorsement Blocks */}
          <div className="mt-10 font-sans">
            <div className="grid grid-cols-3 gap-8 text-center pt-8 border-t border-slate-300">
              <div>
                <div className="h-14 border-b border-dashed border-slate-400"></div>
                <p className="text-xs font-bold text-slate-800 mt-1">{representative.name}</p>
                <p className="text-[11px] text-slate-500">Representative / Collector (Signature)</p>
              </div>

              <div>
                <div className="h-14 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                  <span className="text-xs font-semibold text-emerald-800 tracking-wide">
                    ✓ Verified by Officer
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">{verificationOfficer}</p>
                <p className="text-[11px] text-slate-500">Audited &amp; Signed (Verification Desk)</p>
              </div>

              <div>
                <div className="h-14 border-b border-dashed border-slate-400"></div>
                <p className="text-xs font-bold text-slate-800 mt-1">{authorityTitle}</p>
                <p className="text-[11px] text-slate-500">Sanctioning Authority (Reward Approval &amp; Payment)</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
