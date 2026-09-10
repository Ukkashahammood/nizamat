import React, { useState } from 'react';
import { BankTransaction, BANK_CONFIGS } from '../types';
import { parseExcelBankStatement, formatCurrency } from '../utils/formatters';
import { UploadCloud, FileSpreadsheet, Plus, X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface BankStatementImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTransactions: (transactions: BankTransaction[]) => void;
}

export const BankStatementImporter: React.FC<BankStatementImporterProps> = ({
  isOpen,
  onClose,
  onImportTransactions,
}) => {
  const [selectedBank, setSelectedBank] = useState<string>('SBI');
  const [selectedSubAccount, setSelectedSubAccount] = useState<string>('ZAKAT');
  const [importMode, setImportMode] = useState<'upload' | 'paste' | 'manual'>('upload');
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewRows, setPreviewRows] = useState<Partial<BankTransaction>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Paste mode text
  const [pastedText, setPastedText] = useState('');

  // Manual mode state
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [manualTxnId, setManualTxnId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNarration, setManualNarration] = useState('');
  const [manualDonor, setManualDonor] = useState('');
  const [manualCity, setManualCity] = useState('');

  if (!isOpen) return null;

  const currentBankConfig = BANK_CONFIGS.find(b => b.bank === selectedBank) || BANK_CONFIGS[0];

  const handleBankChange = (bank: string) => {
    setSelectedBank(bank);
    const cfg = BANK_CONFIGS.find(b => b.bank === bank);
    if (cfg && cfg.subAccounts.length > 0) {
      setSelectedSubAccount(cfg.subAccounts[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const parsed = await parseExcelBankStatement(selectedFile, selectedBank, selectedSubAccount);
      if (parsed.length === 0) {
        setErrorMsg('No valid transaction rows found in file. Please ensure columns have Date, Transaction ID / Narration, and Amount.');
      } else {
        setPreviewRows(parsed);
      }
    } catch (err: any) {
      setErrorMsg('Failed to parse Excel statement: ' + (err?.message || 'Invalid format'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setErrorMsg(null);
    const lines = pastedText.trim().split('\n');
    const parsed: Partial<BankTransaction>[] = [];

    for (const line of lines) {
      const parts = line.split(/\t|,|;/).map(p => p.trim());
      if (parts.length < 2) continue;

      // Extract amount (last numeric field or field matching amount)
      let amount = 0;
      let date = new Date().toISOString().slice(0, 10);
      let txnId = '';
      let narration = '';

      for (const part of parts) {
        const cleanNum = part.replace(/[^0-9.-]/g, '');
        if (cleanNum && !isNaN(Number(cleanNum)) && Number(cleanNum) > 0 && !amount) {
          amount = Number(cleanNum);
        } else if (/^\d{4}-\d{2}-\d{2}$|^\d{2}[/-]\d{2}[/-]\d{2,4}$/.test(part)) {
          date = part;
        } else if (/UTR|TXN|IMPS|NEFT|RTGS|UPI|\d{10,}/i.test(part) && !txnId) {
          txnId = part;
        } else if (part.length > 3 && !narration) {
          narration = part;
        }
      }

      if (amount > 0 || txnId) {
        parsed.push({
          id: `tx-paste-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          bank: selectedBank,
          subAccount: selectedSubAccount,
          date,
          transactionId: txnId || `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          narration: narration || line,
          amount: amount || 0,
          status: 'unassigned',
        });
      }
    }

    if (parsed.length === 0) {
      setErrorMsg('Could not detect transactions from pasted text. Try uploading Excel or use manual entry.');
    } else {
      setPreviewRows(parsed);
    }
  };

  const handleAddManual = () => {
    const amt = parseFloat(manualAmount) || 0;
    if (amt <= 0) {
      alert('Please enter valid amount');
      return;
    }
    const singleTx: BankTransaction = {
      id: `tx-man-${Date.now()}`,
      bank: selectedBank,
      subAccount: selectedSubAccount,
      date: manualDate,
      transactionId: manualTxnId.trim() || `MAN-${Date.now().toString().slice(-8)}`,
      narration: manualNarration.trim() || 'Direct bank deposit',
      amount: amt,
      donorName: manualDonor.trim() || undefined,
      donorCity: manualCity.trim() || undefined,
      status: 'unassigned',
    };

    onImportTransactions([singleTx]);
    onClose();
  };

  const handleConfirmImport = () => {
    const fullTransactions: BankTransaction[] = previewRows.map((p, idx) => ({
      id: p.id || `tx-${Date.now()}-${idx}`,
      bank: selectedBank,
      subAccount: selectedSubAccount,
      date: p.date || new Date().toISOString().slice(0, 10),
      transactionId: p.transactionId || `TX-${Math.random().toString(36).slice(2, 9)}`,
      narration: p.narration || 'Credit Entry',
      amount: p.amount || 0,
      donorName: p.donorName,
      donorCity: p.donorCity,
      representativeName: p.representativeName,
      status: p.representativeName ? 'assigned' : 'unassigned',
    }));

    onImportTransactions(fullTransactions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-xl border border-emerald-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Import Net Banking Statement</h2>
              <p className="text-xs text-slate-300">SBI (Zakat/Atiya/Building), HDFC (892/312/124), or IDBI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bank & Sub-account selector */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Bank Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Bank <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['SBI', 'HDFC', 'IDBI'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => handleBankChange(bank)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      selectedBank === bank
                        ? 'bg-slate-900 text-white border-slate-900 shadow'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-account select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Account / Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedSubAccount}
                onChange={(e) => setSelectedSubAccount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {currentBankConfig.subAccounts.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Import Modes Switcher */}
          <div className="flex border-b border-slate-200 pt-2">
            <button
              onClick={() => setImportMode('upload')}
              className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                importMode === 'upload'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload Excel (.xlsx / .xls) / CSV
            </button>
            <button
              onClick={() => setImportMode('paste')}
              className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                importMode === 'paste'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Paste Statement Rows
            </button>
            <button
              onClick={() => setImportMode('manual')}
              className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                importMode === 'manual'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Single Entry (Direct)
            </button>
          </div>
        </div>

        {/* Import Mode Content */}
        <div className="p-6">
          
          {importMode === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all text-center">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
                <span className="text-sm font-semibold text-slate-800">
                  {file ? file.name : 'Click to select or drag & drop Netbanking Excel (.xlsx, .xls) or CSV'}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Automatic column matching for Transaction ID / UTR, Narration, and Deposit Amount
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {isProcessing && (
                <div className="text-center py-4 text-xs text-slate-500 font-medium animate-pulse">
                  Parsing Excel rows, matching columns...
                </div>
              )}
            </div>
          )}

          {importMode === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Paste copied rows directly from Excel or Netbanking web statement:
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste tab-separated or comma-separated rows (Date, Txn ID, Description, Amount)..."
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Extract Rows
              </button>
            </div>
          )}

          {importMode === 'manual' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction ID / UTR <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualTxnId}
                  onChange={(e) => setManualTxnId(e.target.value)}
                  placeholder="e.g. SBI-UTR40928172910"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Credit Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Donor Name (if available)
                </label>
                <input
                  type="text"
                  value={manualDonor}
                  onChange={(e) => setManualDonor(e.target.value)}
                  placeholder="e.g. Dr. Nadeem Akhtar"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Narration / Description
                </label>
                <input
                  type="text"
                  value={manualNarration}
                  onChange={(e) => setManualNarration(e.target.value)}
                  placeholder="UPI/Dr. Nadeem Akhtar/Transfer"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddManual}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                >
                  Add Transaction to Ledger
                </button>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {previewRows.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-slate-700">
                  Ready to Import: {previewRows.length} Transactions into {selectedBank} ({selectedSubAccount})
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  Total: {formatCurrency(previewRows.reduce((s, r) => s + (r.amount || 0), 0))}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Txn ID / UTR</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-600">{r.date}</td>
                        <td className="p-2 font-mono text-slate-800">{r.transactionId}</td>
                        <td className="p-2 text-slate-700 max-w-xs truncate">{r.narration}</td>
                        <td className="p-2 text-right font-semibold text-slate-900">{formatCurrency(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewRows([])}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Clear Preview
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Append {previewRows.length} Rows to Bank Ledger</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
