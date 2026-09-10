import React, { useState, useMemo } from 'react';
import { BankTransaction, Representative } from '../types';
import { formatCurrency, formatNumber, exportToExcel } from '../utils/formatters';
import { 
  Search, Filter, Plus, FileSpreadsheet, Download, 
  Printer, UserCheck, CheckCircle2, AlertCircle, ArrowUpDown, 
  Building2, SlidersHorizontal, UserPlus, Sparkles
} from 'lucide-react';

interface TransactionReconciliationTableProps {
  transactions: BankTransaction[];
  representatives: Representative[];
  onUpdateTransaction: (updated: BankTransaction) => void;
  onOpenImporter: () => void;
  onOpenRepresentativeSheet: (representative: Representative) => void;
  onAddRepresentative: (name: string, region?: string) => void;
}

export const TransactionReconciliationTable: React.FC<TransactionReconciliationTableProps> = ({
  transactions,
  representatives,
  onUpdateTransaction,
  onOpenImporter,
  onOpenRepresentativeSheet,
  onAddRepresentative,
}) => {
  // Screenshot search query (Txn ID, UTR, Amount, Donor)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('ALL');
  const [selectedSubAccountFilter, setSelectedSubAccountFilter] = useState<string>('ALL');
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');

  // New Representative inline modal/popover
  const [showAddRepModal, setShowAddRepModal] = useState(false);
  const [newRepName, setNewRepName] = useState('');
  const [newRepRegion, setNewRepRegion] = useState('');

  // Filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search query across Txn ID, Narration, Donor, Amount, Representative
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTxnId = t.transactionId.toLowerCase().includes(q);
        const matchesNarration = t.narration.toLowerCase().includes(q);
        const matchesDonor = (t.donorName || '').toLowerCase().includes(q);
        const matchesRep = (t.representativeName || '').toLowerCase().includes(q);
        const matchesAmount = String(t.amount).includes(q);
        if (!matchesTxnId && !matchesNarration && !matchesDonor && !matchesRep && !matchesAmount) {
          return false;
        }
      }

      // Bank Filter
      if (selectedBankFilter !== 'ALL' && t.bank !== selectedBankFilter) {
        return false;
      }

      // Sub-account Filter
      if (selectedSubAccountFilter !== 'ALL' && t.subAccount !== selectedSubAccountFilter) {
        return false;
      }

      // Representative Filter
      if (selectedRepFilter !== 'ALL') {
        if (t.representativeName !== selectedRepFilter) return false;
      }

      // Assignment status filter
      if (assignmentFilter === 'UNASSIGNED' && t.representativeName) return false;
      if (assignmentFilter === 'ASSIGNED' && !t.representativeName) return false;

      return true;
    });
  }, [transactions, searchQuery, selectedBankFilter, selectedSubAccountFilter, selectedRepFilter, assignmentFilter]);

  // Statistics
  const totalLedgerAmount = transactions.reduce((s, t) => s + t.amount, 0);
  const totalAssignedAmount = transactions.filter(t => t.representativeName).reduce((s, t) => s + t.amount, 0);
  const totalUnassignedAmount = totalLedgerAmount - totalAssignedAmount;
  const unassignedCount = transactions.filter(t => !t.representativeName).length;

  const handleAssignRep = (transaction: BankTransaction, repName: string) => {
    const updated: BankTransaction = {
      ...transaction,
      representativeName: repName || undefined,
      status: repName ? 'assigned' : 'unassigned',
      verifiedDate: repName ? new Date().toISOString().slice(0, 10) : undefined,
      verifiedBy: repName ? 'Verification Officer' : undefined,
    };
    onUpdateTransaction(updated);
  };

  const handleCreateRep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepName.trim()) return;
    onAddRepresentative(newRepName.trim(), newRepRegion.trim() || undefined);
    setNewRepName('');
    setNewRepRegion('');
    setShowAddRepModal(false);
  };

  const handleExportCurrent = () => {
    exportToExcel(
      filteredTransactions,
      `Bank_Reconciliation_${selectedBankFilter}_${new Date().toISOString().slice(0, 10)}`,
      'Reconciliation Statement'
    );
  };

  const activeRepObject = representatives.find(r => r.name === selectedRepFilter);

  return (
    <div className="space-y-6">
      
      {/* Search & Verification Screenshot Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-2xl text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Netbanking &amp; Screenshot Reconciliation Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white">Find Transaction by UTR / Screenshot Amount</h2>
            <p className="text-xs text-slate-300 mt-1">
              When representative presents donor's bank screenshot, enter the Transaction ID or Amount here to locate the credit and tag the representative's name in the extra column.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenImporter}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Net Banking Excel</span>
            </button>

            <button
              onClick={() => setShowAddRepModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-600 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>+ Add Representative</span>
            </button>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-emerald-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type Transaction ID / UTR (e.g. SBI-UTR409..., HDFC-IMPS...), Amount (e.g. 50000), or Donor Name..."
            className="w-full pl-11 pr-24 py-3 text-sm rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/15 backdrop-blur-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 my-auto px-2.5 py-1 text-xs text-slate-300 hover:text-white rounded bg-white/10 hover:bg-white/20 transition-colors h-fit"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Statement Deposits
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalLedgerAmount)}
          </p>
          <span className="text-[11px] text-slate-500">
            {transactions.length} Total Bank Records
          </span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
            Assigned to Representatives
          </span>
          <p className="text-xl font-bold text-emerald-900 mt-1">
            {formatCurrency(totalAssignedAmount)}
          </p>
          <span className="text-[11px] text-emerald-700">
            Verified &amp; Tagged in Extra Column
          </span>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
            Pending Representative Match
          </span>
          <p className="text-xl font-bold text-amber-900 mt-1">
            {formatCurrency(totalUnassignedAmount)}
          </p>
          <span className="text-[11px] text-amber-700">
            {unassignedCount} Transactions Unclaimed
          </span>
        </div>

        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider block">
              Active Representatives
            </span>
            <p className="text-xl font-bold text-indigo-900 mt-1">
              {representatives.length} Registered
            </p>
          </div>
          <span className="text-[11px] text-indigo-700">
            Ready for isolated copy-paste reward sheet
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Bank Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              Bank:
            </span>
            {['ALL', 'SBI', 'HDFC', 'IDBI'].map((bank) => (
              <button
                key={bank}
                onClick={() => {
                  setSelectedBankFilter(bank);
                  setSelectedSubAccountFilter('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedBankFilter === bank
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {bank}
              </button>
            ))}
          </div>

          {/* Sub Accounts if Bank Selected */}
          {selectedBankFilter === 'SBI' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">SBI A/C:</span>
              {['ALL', 'ZAKAT', 'ATIYA', 'BUILDING'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubAccountFilter(sub)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedSubAccountFilter === sub
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {selectedBankFilter === 'HDFC' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">HDFC A/C:</span>
              {['ALL', '892', '312', '124'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubAccountFilter(sub)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedSubAccountFilter === sub
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Actions on right */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleExportCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>

        </div>

        {/* Second Row: Representative Isolation Filter ("I filter out a particular name and take another sheet where I copy and paste") */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              Filter by Representative:
            </span>

            <select
              value={selectedRepFilter}
              onChange={(e) => setSelectedRepFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-xs text-slate-800"
            >
              <option value="ALL">All Representatives ({representatives.length})</option>
              {representatives.map(rep => (
                <option key={rep.id} value={rep.name}>
                  {rep.name} {rep.region ? `(${rep.region})` : ''}
                </option>
              ))}
            </select>

            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNASSIGNED">Unassigned Only (Needs Verification)</option>
              <option value="ASSIGNED">Assigned Only</option>
            </select>
          </div>

          {/* Dedicated Separate Sheet Button */}
          {selectedRepFilter !== 'ALL' && activeRepObject && (
            <button
              onClick={() => onOpenRepresentativeSheet(activeRepObject)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors animate-bounce-short"
            >
              <Printer className="w-4 h-4" />
              <span>Open Dedicated Reward Sheet &amp; Print for {selectedRepFilter}</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            Bank Statement Ledger ({filteredTransactions.length} of {transactions.length} rows)
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Filtered Value: <strong className="text-slate-900">{formatCurrency(filteredTransactions.reduce((s, t) => s + t.amount, 0))}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-24">Date</th>
                <th className="py-2.5 px-3 w-32">Bank &amp; Account</th>
                <th className="py-2.5 px-3 w-48">Transaction ID / UTR</th>
                <th className="py-2.5 px-3">Narration / Donor</th>
                <th className="py-2.5 px-3 w-32 text-right">Credit Amount</th>
                {/* The core requested Extra Column */}
                <th className="py-2.5 px-3 w-64 bg-indigo-50/70 border-x border-indigo-200 text-indigo-900 font-bold">
                  Representative Name (Extra Column)
                </th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No transactions match your search criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or import new bank statement rows.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const isHighlighted = searchQuery.trim() && (
                    tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                    String(tx.amount) === searchQuery.trim()
                  );

                  return (
                    <tr
                      key={tx.id}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-amber-50/90 font-medium'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/40'
                      } hover:bg-slate-100/60`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{tx.date}</td>
                      <td className="py-2.5 px-3 font-medium">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold mr-1">
                          {tx.bank}
                        </span>
                        <span className="text-slate-600 text-[11px]">{tx.subAccount}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                        {isHighlighted ? (
                          <mark className="bg-amber-200 px-1 rounded text-slate-900">{tx.transactionId}</mark>
                        ) : (
                          tx.transactionId
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {tx.donorName ? (
                          <div>
                            <span className="font-semibold text-slate-900">{tx.donorName}</span>
                            {tx.donorCity && <span className="text-slate-500 text-[11px]"> ({tx.donorCity})</span>}
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">{tx.narration}</div>
                          </div>
                        ) : (
                          <div className="truncate max-w-sm">{tx.narration}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {isHighlighted ? (
                          <mark className="bg-amber-200 px-1 rounded text-slate-900">{formatCurrency(tx.amount)}</mark>
                        ) : (
                          formatCurrency(tx.amount)
                        )}
                      </td>

                      {/* Extra Column: Interactive Representative Selector */}
                      <td className="py-2 px-3 bg-indigo-50/40 border-x border-indigo-100">
                        <select
                          value={tx.representativeName || ''}
                          onChange={(e) => handleAssignRep(tx, e.target.value)}
                          className={`w-full py-1 px-2 text-xs rounded-lg border focus:outline-none transition-colors ${
                            tx.representativeName
                              ? 'bg-white border-indigo-300 font-semibold text-indigo-900 shadow-xs'
                              : 'bg-white/80 border-slate-300 text-slate-500 italic'
                          }`}
                        >
                          <option value="">-- Assign Representative --</option>
                          {representatives.map((rep) => (
                            <option key={rep.id} value={rep.name}>
                              {rep.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Verification Status */}
                      <td className="py-2.5 px-3 text-center">
                        {tx.representativeName ? (
                          <button
                            type="button"
                            onClick={() => {
                              const rep = representatives.find(r => r.name === tx.representativeName);
                              if (rep) onOpenRepresentativeSheet(rep);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                            title="Click to view reward sheet for this representative"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </button>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                            Pending Rep
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add Representative Modal */}
      {showAddRepModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add New Representative</h3>
            <p className="text-xs text-slate-500 mb-4">
              Register a representative who collects donations across different cities/regions.
            </p>

            <form onSubmit={handleCreateRep} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Representative Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRepName}
                  onChange={(e) => setNewRepName(e.target.value)}
                  placeholder="e.g. Maulana Farooq Ahmad"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tour / Visited Region
                </label>
                <input
                  type="text"
                  value={newRepRegion}
                  onChange={(e) => setNewRepRegion(e.target.value)}
                  placeholder="e.g. Bangalore & Mysore"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddRepModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition-colors"
                >
                  Save Representative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
