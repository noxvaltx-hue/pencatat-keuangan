export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  type: 'Pemasukan' | 'Pengeluaran';
  amount: number;
  notes: string;
}

export type TransactionType = 'Pemasukan' | 'Pengeluaran';

export interface Filters {
  month: string; // YYYY-MM format or 'ALL'
  category: string; // Category name or 'ALL'
  type: 'ALL' | 'Pemasukan' | 'Pengeluaran';
  searchQuery: string;
}

export interface SheetInfo {
  spreadsheetId: string;
  sheetName: string;
  sheetId: number;
}

export const INCOME_CATEGORIES = [
  'Gaji',
  'Investasi',
  'Freelance',
  'Sampingan',
  'Lain-lain'
];

export const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja',
  'Tagihan & Utilitas',
  'Kesehatan',
  'Pendidikan',
  'Hiburan',
  'Lain-lain'
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
