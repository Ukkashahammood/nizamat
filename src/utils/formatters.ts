import * as XLSX from 'xlsx';
import { BankTransaction } from '../types';

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return new Intl.NumberFormat('en-IN').format(amount);
}

// Converts Indian number to words (Lakhs, Crores, Thousands)
export function numberToIndianWords(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str.trim();
  };

  let n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  let words = '';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) {
    words += inWords(crore) + ' Crore ';
  }

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) {
    words += inWords(lakh) + ' Lakh ';
  }

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) {
    words += inWords(thousand) + ' Thousand ';
  }

  if (n > 0) {
    words += inWords(n);
  }

  return 'Rupees ' + words.trim() + ' Only';
}

// Export Bank Statement or Representative Statement to real Excel .xlsx
export function exportToExcel(
  transactions: BankTransaction[],
  fileName: string,
  sheetTitle: string = 'Bank Reconciliation'
) {
  const rows = transactions.map((t, idx) => ({
    'S.No': idx + 1,
    'Date': t.date,
    'Bank': t.bank,
    'Account / Category': t.subAccount,
    'Transaction ID / UTR': t.transactionId,
    'Narration / Description': t.narration,
    'Credit Amount (₹)': t.amount,
    'Donor Name': t.donorName || '',
    'Donor City': t.donorCity || '',
    'Representative Name': t.representativeName || '(Unassigned)',
    'Status': t.representativeName ? 'Verified / Assigned' : 'Pending Verification',
    'Verified On': t.verifiedDate || '',
    'Verified By': t.verifiedBy || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 12 }, // Date
    { wch: 8 },  // Bank
    { wch: 18 }, // Account
    { wch: 24 }, // Txn ID
    { wch: 35 }, // Narration
    { wch: 16 }, // Credit Amount
    { wch: 22 }, // Donor Name
    { wch: 15 }, // Donor City
    { wch: 25 }, // Representative Name
    { wch: 20 }, // Status
    { wch: 14 }, // Verified On
    { wch: 20 }, // Verified By
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle.substring(0, 31));

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

// Parse uploaded Excel (.xlsx, .xls) or CSV
export async function parseExcelBankStatement(
  file: File,
  bank: string,
  subAccount: string
): Promise<Partial<BankTransaction>[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const parsed: Partial<BankTransaction>[] = [];

  for (const row of rawRows) {
    // Attempt intelligent column mapping for net banking exports (SBI, HDFC, IDBI, generic)
    const keys = Object.keys(row);

    // Find date
    const dateKey = keys.find(k => /date|txn\s*date|value\s*date/i.test(k));
    const rawDate = dateKey ? String(row[dateKey]).trim() : new Date().toISOString().slice(0, 10);

    // Find Transaction ID / Ref / UTR / Chq
    const txnKey = keys.find(k => /tx|ref|utr|chq|cheque|journal|id/i.test(k));
    const rawTxnId = txnKey ? String(row[txnKey]).trim() : '';

    // Find Narration / Description
    const descKey = keys.find(k => /desc|narration|particular|detail|remark/i.test(k));
    const rawDesc = descKey ? String(row[descKey]).trim() : '';

    // Find Amount (Credit / Deposit / Amount)
    const amountKey = keys.find(k => /credit|deposit|amt|amount/i.test(k));
    let rawAmount = 0;
    if (amountKey) {
      const valStr = String(row[amountKey]).replace(/[^0-9.-]/g, '');
      rawAmount = parseFloat(valStr) || 0;
    }

    // Representative Name if already present in an extra column
    const repKey = keys.find(k => /rep|representative|agent|collector|name/i.test(k) && !/donor/i.test(k));
    const rawRep = repKey ? String(row[repKey]).trim() : '';

    // Donor Name if present
    const donorKey = keys.find(k => /donor|remitter|customer/i.test(k));
    const rawDonor = donorKey ? String(row[donorKey]).trim() : '';

    if (rawAmount > 0 || rawTxnId || rawDesc) {
      parsed.push({
        id: 'tx-' + Math.random().toString(36).substring(2, 9),
        bank,
        subAccount,
        date: rawDate.includes('T') ? rawDate.split('T')[0] : rawDate,
        transactionId: rawTxnId || `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        narration: rawDesc || 'Bank Credit Entry',
        amount: Math.abs(rawAmount),
        donorName: rawDonor || undefined,
        representativeName: rawRep || undefined,
        status: rawRep ? 'assigned' : 'unassigned',
      });
    }
  }

  return parsed;
}
