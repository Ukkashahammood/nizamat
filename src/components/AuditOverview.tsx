import React from 'react';
import { BillRecord, BankTransaction, Representative } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { 
  BarChart3, Building2, Wallet, Users, Award, Download, 
  Upload, RotateCcw, CheckCircle2, ShieldCheck, Printer, ArrowRight
} from 'lucide-react';

interface AuditOverviewProps {
  bills: BillRecord[];
  transactions: BankTransaction[];
  representatives: Representative[];
  onOpenRepresentativeSheet: (rep: Representative) => void;
  onExportDataBackup: () => void;
  onImportDataBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSampleData: () => void;
  onNavigateTab: (tab: 'bills' | 'reconciliation') => void;
}

export const AuditOverview: React.FC<AuditOverviewProps> = ({
  bills,
  transactions,
  representatives,
  onOpenRepresentativeSheet,
  onExportDataBackup,
  onImportDataBackup,
  onResetSampleData,
  onNavigateTab,
}) => {
  // Financial summaries
  const totalBillsAmount = bills.reduce((s, b) => s + (b.verifiedAmount ?? b.estimateAmount), 0);
  const totalBankDonations = transactions.reduce((s, t) => s + t.amount, 0);
  const totalAssignedToReps = transactions.filter(t => t.representativeName).reduce((s, t) => s + t.amount, 0);

  // Department distribution
  const deptSummary = bills.reduce((acc, b) => {
    acc[b.department] = (acc[b.department] || 0) + (b.verifiedAmount ?? b.estimateAmount);
    return acc;
  }, {} as Record<string, number>);

  // Bank distribution
  const bankSummary = transactions.reduce((acc, t) => {
    const key = `${t.bank} (${t.subAccount})`;
    acc[key] = (acc[key] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Representative totals
  const repTotals = representatives.map(rep => {
    const repTxns = transactions.filter(t => t.representativeName === rep.name);
    const sum = repTxns.reduce((s, t) => s + t.amount, 0);
    return {
      rep,
      count: repTxns.length,
      total: sum,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Executive Audit &amp; Data Control Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Accounts &amp; Verification Overview</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time balance between department bill verifications, Netbanking donation matching, and representative reward statements.
          </p>
        </div>

        {/* Data Persistence Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onExportDataBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            title="Download JSON backup of all bills and transactions"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backup Data (JSON)</span>
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Restore Backup</span>
            <input type="file" accept=".json" onChange={onImportDataBackup} className="hidden" />
          </label>

          <button
            onClick={onResetSampleData}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs transition-colors"
            title="Reload default sample bills and banking statements"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div 
          onClick={() => onNavigateTab('bills')}
          className="p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Department Bills Audited
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(totalBillsAmount)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {bills.length} Bar'awurd estimates (22 Departments)
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('reconciliation')}
          className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Total Bank Donations Credited
            </span>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">
            {formatCurrency(totalBankDonations)}
          </p>
          <span className="text-xs text-emerald-700 mt-1 block">
            SBI (Zakat, Atiya, Building), HDFC (892, 312, 124), IDBI
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('reconciliation')}
          className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:border-indigo-400 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">
              Verified by Representatives
            </span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-2">
            {formatCurrency(totalAssignedToReps)}
          </p>
          <span className="text-xs text-indigo-700 mt-1 block">
            Tagged in Extra Column for Reward Sanction
          </span>
        </div>

      </div>

      {/* Two Columns: Representative Reward Center & Department/Bank Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Representatives Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Representative Donation Collections &amp; Reward Sheets
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              1-Click Copy-Paste Sheet
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-96">
            {repTotals.map(({ rep, count, total }) => (
              <div key={rep.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{rep.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>Region: {rep.region || 'General Tour'}</span>
                    <span>•</span>
                    <span className="font-mono">{count} Verified Deposits</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Verified Collection</span>
                    <span className="font-bold text-slate-900 text-sm">{formatCurrency(total)}</span>
                  </div>

                  <button
                    onClick={() => onOpenRepresentativeSheet(rep)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors"
                    title="Generate printable reward sheet with copy-paste format"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Reward Sheet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Accounts Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Bank Deposits Breakdown by Account
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total: {formatCurrency(totalBankDonations)}
            </span>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-96">
            {(Object.entries(bankSummary) as [string, number][]).map(([bankName, amount]) => {
              const pct = totalBankDonations > 0 ? ((amount / totalBankDonations) * 100).toFixed(1) : '0';
              return (
                <div key={bankName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{bankName}</span>
                    <span className="font-mono text-slate-700">
                      <strong>{formatCurrency(amount)}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Department Audited Bills Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-600" />
          <span>Active Department Expenditure Summary (Audited Bar'awurd Bills)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(Object.entries(deptSummary) as [string, number][]).map(([dept, amount]) => (
            <div key={dept} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800 block truncate">{dept}</span>
              <span className="text-sm font-extrabold text-slate-900 mt-1 block">{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
