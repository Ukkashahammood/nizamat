export const DEPARTMENTS = [
  'DARUL ULOOM',
  'TAMIR-O-TARAQQI',
  'DAWAT-O-IRSHAD',
  'NIZAMAT',
  'MAHAD SIKRAURI',
  'SAYYADNA ABU BAKAR SIDDIQUE, MAHIPATMAU',
  'MAZHARUL ISLAM, BILLOCHPURA',
  'FAWAD KHALIL',
  'USMAN BIN AFFAN',
  'RABITA ADAB ISLAMI',
  'GUEST HOUSE (MAHMAN KHANA)',
  'LIBRARY',
  'BARAWAN KALAN',
  'DARUL QAZA',
  'KULLIYAT-UL-LUGHA',
  'MESS NADWA',
  'MESS MAHAD',
  'MESS SAYYADNA ABU BAKAR SIDDIQ, MAHIPATMAU',
  'MESS FAWAD KHALIL',
  'MESS MAZHARUL ISLAM, BILLOCHPURA',
  'MESS USMAN BIN AFFAN',
  'CUSTOM',
] as const;

export type DepartmentName = (typeof DEPARTMENTS)[number] | string;

export interface SupportingVoucher {
  id: string;
  voucherNo: string;
  date: string;
  vendorOrPerson: string;
  description: string;
  amount: number;
  status: 'checked' | 'flagged' | 'pending';
  remarks?: string;
  billAttachmentName?: string;
}

export type BillStatus = 
  | 'received' 
  | 'in_verification' 
  | 'discrepancy' 
  | 'verified' 
  | 'passed_for_payment' 
  | 'paid';

export interface BillRecord {
  id: string;
  barawurdNo: string; // Front page reference
  receivedDate: string; // YYYY-MM-DD
  receivedTime: string; // HH:mm
  department: DepartmentName;
  customDepartmentName?: string;
  broughtBy: string;
  broughtByContact?: string;
  receivedBy: string;
  initialDescription: string;
  estimateAmount: number; // Front page Bar'awurd estimated total
  verifiedAmount?: number; // Verified amount after auditing vouchers
  status: BillStatus;
  supportingVouchers: SupportingVoucher[];
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedByOfficer?: string;
  passedToPaymentBy?: string;
  passedToPaymentAt?: string;
  paymentRemarks?: string;
  paidAt?: string;
  forwardingDepartment?: string;
}

export interface BankInfo {
  bank: 'SBI' | 'HDFC' | 'IDBI' | string;
  subAccounts: string[];
}

export const BANK_CONFIGS: BankInfo[] = [
  {
    bank: 'SBI',
    subAccounts: ['ZAKAT', 'ATIYA', 'BUILDING'],
  },
  {
    bank: 'HDFC',
    subAccounts: ['892', '312', '124'],
  },
  {
    bank: 'IDBI',
    subAccounts: ['GENERAL DONATION'],
  },
];

export interface BankTransaction {
  id: string;
  bank: string;
  subAccount: string;
  date: string;
  transactionId: string; // UTR or Ref ID
  narration: string;
  amount: number;
  donorName?: string;
  donorCity?: string;
  representativeName?: string; // The "extra column"
  status: 'unassigned' | 'assigned' | 'verified_signed';
  verifiedDate?: string;
  verifiedBy?: string;
  screenshotRef?: string;
  rewardPercentageOrRate?: number;
  notes?: string;
}

export interface Representative {
  id: string;
  name: string;
  phone?: string;
  region?: string;
  notes?: string;
}
