import React, { useState, useEffect } from 'react';
import { 
  BillRecord, BankTransaction, Representative, DEPARTMENTS 
} from './types';
import { 
  INITIAL_BILLS, INITIAL_TRANSACTIONS, INITIAL_REPRESENTATIVES 
} from './data/mockData';
import { BillPipelineView } from './components/BillPipelineView';
import { BillReceiveModal } from './components/BillReceiveModal';
import { BillVerificationModal } from './components/BillVerificationModal';
import { PrintBarawurdSlip } from './components/PrintBarawurdSlip';
import { TransactionReconciliationTable } from './components/TransactionReconciliationTable';
import { BankStatementImporter } from './components/BankStatementImporter';
import { RepresentativeRewardSheet } from './components/RepresentativeRewardSheet';
import { AuditOverview } from './components/AuditOverview';
import { 
  FileCheck2, Building2, Landmark, BarChart3, 
  ShieldCheck, CheckCircle2, User, Printer, FileSpreadsheet,
  HelpCircle, ChevronRight
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'bills' | 'reconciliation' | 'overview'>('bills');

  // Core Data Persistent in localStorage
  const [bills, setBills] = useState<BillRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nadwa_bills_data');
      return saved ? JSON.parse(saved) : INITIAL_BILLS;
    } catch {
      return INITIAL_BILLS;
    }
  });

  const [transactions, setTransactions] = useState<BankTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('nadwa_transactions_data');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [representatives, setRepresentatives] = useState<Representative[]>(() => {
    try {
      const saved = localStorage.getItem('nadwa_representatives_data');
      return saved ? JSON.parse(saved) : INITIAL_REPRESENTATIVES;
    } catch {
      return INITIAL_REPRESENTATIVES;
    }
  });

  // Modals state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [activeVerifyBill, setActiveVerifyBill] = useState<BillRecord | null>(null);
  const [activePrintBill, setActivePrintBill] = useState<BillRecord | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [activeRewardSheetRep, setActiveRewardSheetRep] = useState<Representative | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nadwa_bills_data', JSON.stringify(bills));
    } catch (e) {
      console.error('Storage error', e);
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem('nadwa_transactions_data', JSON.stringify(transactions));
    } catch (e) {
      console.error('Storage error', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('nadwa_representatives_data', JSON.stringify(representatives));
    } catch (e) {
      console.error('Storage error', e);
    }
  }, [representatives]);

  // Handlers for Bills
  const handleSaveNewBill = (newBill: BillRecord) => {
    setBills(prev => [newBill, ...prev]);
    showToast(`Bill ${newBill.barawurdNo} received from ${newBill.broughtBy} (${newBill.department})`);
  };

  const handleUpdateBill = (updated: BillRecord) => {
    setBills(prev => prev.map(b => (b.id === updated.id ? updated : b)));
    if (activeVerifyBill?.id === updated.id) {
      setActiveVerifyBill(updated);
    }
    showToast(`Updated verification for ${updated.barawurdNo}`);
  };

  const handleQuickPassForPayment = (bill: BillRecord) => {
    const updated: BillRecord = {
      ...bill,
      status: 'passed_for_payment',
      passedToPaymentAt: new Date().toLocaleString('en-GB'),
      passedToPaymentBy: 'Verification Officer',
      forwardingDepartment: 'Central Accounts & Treasury',
      verifiedAmount: bill.verifiedAmount ?? bill.estimateAmount,
    };
    handleUpdateBill(updated);
    showToast(`Bill ${bill.barawurdNo} passed forward for final payment!`);
  };

  // Handlers for Transactions
  const handleImportTransactions = (newTxns: BankTransaction[]) => {
    setTransactions(prev => [...newTxns, ...prev]);
    showToast(`Successfully imported ${newTxns.length} bank transactions into ledger.`);
  };

  const handleUpdateTransaction = (updated: BankTransaction) => {
    setTransactions(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    if (updated.representativeName) {
      showToast(`Assigned ${updated.representativeName} to Transaction ${updated.transactionId}`);
    }
  };

  const handleAddRepresentative = (name: string, region?: string) => {
    const newRep: Representative = {
      id: `rep-${Date.now()}`,
      name,
      region,
    };
    setRepresentatives(prev => [...prev, newRep]);
    showToast(`Added Representative: ${name}`);
  };

  // Data Backup & Restore
  const handleExportDataBackup = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      bills,
      transactions,
      representatives,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Verification_Portal_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded successfully.');
  };

  const handleImportDataBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.bills && data.transactions) {
          setBills(data.bills);
          setTransactions(data.transactions);
          if (data.representatives) setRepresentatives(data.representatives);
          showToast('Backup restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleData = () => {
    if (confirm('Reset to initial sample bills and bank statements? Any newly entered records will be replaced.')) {
      setBills(INITIAL_BILLS);
      setTransactions(INITIAL_TRANSACTIONS);
      setRepresentatives(INITIAL_REPRESENTATIVES);
      showToast('Sample demo data restored.');
    }
  };

  // Filtered transactions for active representative reward sheet
  const activeRepTransactions = activeRewardSheetRep
    ? transactions.filter(t => t.representativeName === activeRewardSheetRep.name)
    : [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation Bar - Hidden on Print */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & App Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-lg shadow-sm border border-slate-800">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                    Verification &amp; Accounts Portal
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Darul Uloom Nadwatul Ulama • Bill Verification &amp; Bank Reconciliation Desk
                </p>
              </div>
            </div>

            {/* Verification Officer Stamp */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-800 block">Verification Officer</span>
                <span className="text-[11px] text-slate-500">Accounts &amp; Audit Section</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

          </div>

          {/* Module Tab Switcher */}
          <div className="flex space-x-1 border-t border-slate-100 py-1 overflow-x-auto">
            
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'bills'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>1. Bills &amp; Bar’awurd (برآورد) Pipeline</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white ml-1">
                {bills.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'reconciliation'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>2. Bank Reconciliation &amp; Rep Reward Sheets</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white ml-1">
                {transactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>3. Audit Summary &amp; Backup</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: Bills & Bar'awurd Pipeline */}
        {activeTab === 'bills' && (
          <BillPipelineView
            bills={bills}
            onOpenReceiveModal={() => setIsReceiveModalOpen(true)}
            onOpenVerifyModal={(bill) => setActiveVerifyBill(bill)}
            onOpenPrintSlip={(bill) => setActivePrintBill(bill)}
            onQuickPassForPayment={handleQuickPassForPayment}
          />
        )}

        {/* Tab 2: Bank Statement Reconciliation & Representative Reward */}
        {activeTab === 'reconciliation' && (
          <TransactionReconciliationTable
            transactions={transactions}
            representatives={representatives}
            onUpdateTransaction={handleUpdateTransaction}
            onOpenImporter={() => setIsImporterOpen(true)}
            onOpenRepresentativeSheet={(rep) => setActiveRewardSheetRep(rep)}
            onAddRepresentative={handleAddRepresentative}
          />
        )}

        {/* Tab 3: Executive Overview & Backup */}
        {activeTab === 'overview' && (
          <AuditOverview
            bills={bills}
            transactions={transactions}
            representatives={representatives}
            onOpenRepresentativeSheet={(rep) => setActiveRewardSheetRep(rep)}
            onExportDataBackup={handleExportDataBackup}
            onImportDataBackup={handleImportDataBackup}
            onResetSampleData={handleResetSampleData}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

      </main>

      {/* Footer - Hidden on Print */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Verification &amp; Accounts Portal • Built for Bar’awurd Audits &amp; Bank Donation Reconciliation</span>
          <span>SBI (Zakat, Atiya, Building) • HDFC (892, 312, 124) • IDBI</span>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal 1: Receive Bill */}
      {isReceiveModalOpen && (
        <BillReceiveModal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          onSave={handleSaveNewBill}
        />
      )}

      {/* Modal 2: Check & Verify Bill */}
      {activeVerifyBill && (
        <BillVerificationModal
          bill={activeVerifyBill}
          isOpen={!!activeVerifyBill}
          onClose={() => setActiveVerifyBill(null)}
          onUpdateBill={handleUpdateBill}
          onOpenPrint={(bill) => {
            setActiveVerifyBill(null);
            setActivePrintBill(bill);
          }}
        />
      )}

      {/* Modal 3: Print Bar'awurd Slip */}
      {activePrintBill && (
        <PrintBarawurdSlip
          bill={activePrintBill}
          onClose={() => setActivePrintBill(null)}
        />
      )}

      {/* Modal 4: Import Netbanking Statement */}
      {isImporterOpen && (
        <BankStatementImporter
          isOpen={isImporterOpen}
          onClose={() => setIsImporterOpen(false)}
          onImportTransactions={handleImportTransactions}
        />
      )}

      {/* Modal 5: Representative Reward & Filtered Sheet */}
      {activeRewardSheetRep && (
        <RepresentativeRewardSheet
          representative={activeRewardSheetRep}
          transactions={activeRepTransactions}
          onClose={() => setActiveRewardSheetRep(null)}
        />
      )}

    </div>
  );
}
