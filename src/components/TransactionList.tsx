import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Filter, 
  Calendar, 
  Utensils, 
  Car, 
  ShoppingBag, 
  HeartPulse, 
  GraduationCap, 
  Gamepad2, 
  Coins, 
  Briefcase, 
  Laptop, 
  TrendingUp, 
  CircleDollarSign, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  AlertTriangle
} from 'lucide-react';
import { Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';
import { formatRupiah, formatReadableDate } from '../utils';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

// Category to Icon mapping
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Makanan & Minuman':
      return <Utensils className="h-4 w-4" />;
    case 'Transportasi':
      return <Car className="h-4 w-4" />;
    case 'Belanja':
      return <ShoppingBag className="h-4 w-4" />;
    case 'Kesehatan':
      return <HeartPulse className="h-4 w-4" />;
    case 'Pendidikan':
      return <GraduationCap className="h-4 w-4" />;
    case 'Hiburan':
      return <Gamepad2 className="h-4 w-4" />;
    case 'Gaji':
      return <Briefcase className="h-4 w-4" />;
    case 'Freelance':
      return <Laptop className="h-4 w-4" />;
    case 'Sampingan':
      return <TrendingUp className="h-4 w-4" />;
    case 'Investasi':
      return <Coins className="h-4 w-4" />;
    default:
      return <CircleDollarSign className="h-4 w-4" />;
  }
};

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
  isDeleting,
}: TransactionListProps) {
  // Filters state
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Delete modal confirmation state
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Group months present in transactions to build dynamic filters
  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthsSet.add(tx.date.substring(0, 7)); // YYYY-MM
      }
    });

    const indonesianMonths = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a)) // show newest month first
      .map((m) => {
        const [year, month] = m.split('-');
        const name = indonesianMonths[parseInt(month) - 1];
        return {
          value: m,
          label: `${name} ${year}`,
        };
      });
  }, [transactions]);

  // Combine static and custom categories present
  const availableCategories = useMemo(() => {
    const catsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category) catsSet.add(tx.category);
    });
    // Ensure standard categories are in, plus any other custom ones
    INCOME_CATEGORIES.forEach(c => catsSet.add(c));
    EXPENSE_CATEGORIES.forEach(c => catsSet.add(c));
    return Array.from(catsSet);
  }, [transactions]);

  // Handle filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month Filter
      if (selectedMonth !== 'ALL') {
        if (!tx.date.startsWith(selectedMonth)) return false;
      }

      // Category Filter
      if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) {
        return false;
      }

      // Type Filter
      if (selectedType !== 'ALL' && tx.type !== selectedType) {
        return false;
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const categoryMatch = tx.category.toLowerCase().includes(query);
        const notesMatch = tx.notes.toLowerCase().includes(query);
        const amountMatch = String(tx.amount).includes(query);
        if (!categoryMatch && !notesMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [transactions, selectedMonth, selectedCategory, selectedType, searchQuery]);

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    try {
      await onDelete(deletingTx.id);
      setDeletingTx(null); // safely close dialog
    } catch {
      // handled in parent
    }
  };

  // Helper to resolve custom badge colors based on category item
  const getCategoryBadgeClass = (category: string, type: string) => {
    if (type === 'Pemasukan') {
      return 'bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase';
    }
    switch (category) {
      case 'Makanan & Minuman':
        return 'bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase';
      case 'Transportasi':
        return 'bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase';
      case 'Belanja':
        return 'bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase';
      case 'Kesehatan':
        return 'bg-teal-100 text-teal-750 text-[10px] font-bold px-2 py-1 rounded-lg uppercase';
      case 'Pendidikan':
        return 'bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase';
      case 'Hiburan':
        return 'bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase';
      default:
        return 'bg-slate-100 text-slate-705 text-[10px] font-bold px-2 py-1 rounded-lg uppercase';
    }
  };

  return (
    <div id="transaction-list-section" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 flex flex-col">
      
      {/* Search and Filters Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
          <div className="space-y-1">
            <h2 id="transactions-header-title" className="text-xl font-bold text-slate-800 tracking-tight">
              Riwayat Transaksi
            </h2>
            <p className="text-xs text-slate-400">
              Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
            </p>
          </div>

          {/* Quick Clear Filters */}
          {(selectedMonth !== 'ALL' || selectedCategory !== 'ALL' || selectedType !== 'ALL' || searchQuery !== '') && (
            <button
              id="clear-filters-btn"
              onClick={() => {
                setSelectedMonth('ALL');
                setSelectedCategory('ALL');
                setSelectedType('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl transition"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Dynamic Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              id="filter-search"
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-700"
            />
          </div>

          {/* Month Select */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2.5 ring-1 ring-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <select
              id="filter-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full py-2 bg-transparent text-xs text-slate-700 font-bold focus:outline-none"
            >
              <option value="ALL">Semua Bulan</option>
              {uniqueMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2.5 ring-1 ring-slate-200">
            <Filter className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 bg-transparent text-xs text-slate-700 font-bold focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Type Select */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2.5 ring-1 ring-slate-200">
            <Filter className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <select
              id="filter-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 bg-transparent text-xs text-slate-700 font-bold focus:outline-none"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="Pemasukan">Pemasukan Only</option>
              <option value="Pengeluaran">Pengeluaran Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* Transactions Container */}
      {filteredTransactions.length === 0 ? (
        <div id="tx-empty-state" className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-indigo-100 bg-indigo-50/10">
          <CircleDollarSign className="h-10 w-10 text-indigo-350 mx-auto animate-pulse mb-3" />
          <h4 className="text-slate-750 font-bold text-sm">Tidak ada transaksi ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Silakan coba ubah pengaturan filter Anda atau catat transaksi keuangan baru.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table id="transactions-table" className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 text-right">Jumlah</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} id={`tx-row-${tx.id}`} className="hover:bg-indigo-50/30 transition-colors group">
                  {/* Tanggal */}
                  <td className="px-6 py-4 font-medium text-slate-650 group-hover:text-slate-900 transition-colors text-xs">
                    {formatReadableDate(tx.date)}
                  </td>
                  
                  {/* Kategori Badge formatted */}
                  <td className="px-6 py-4">
                    <span className={getCategoryBadgeClass(tx.category, tx.type)}>
                      {tx.category}
                    </span>
                  </td>

                  {/* Keterangan */}
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate group-hover:text-slate-800 transition-colors">
                    {tx.notes || <span className="text-slate-300 italic">tanpa keterangan</span>}
                  </td>

                  {/* Jumlah Uang */}
                  <td className={`px-6 py-4 text-right font-black text-xs whitespace-nowrap ${
                    tx.type === 'Pemasukan' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {tx.type === 'Pemasukan' ? '+' : '-'} {formatRupiah(tx.amount)}
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <button
                        id={`edit-btn-${tx.id}`}
                        onClick={() => onEdit(tx)}
                        title="Edit transaksi"
                        className="p-1 px-1.5 bg-indigo-50 text-indigo-650 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors text-[11px]"
                      >
                        ✎
                      </button>
                      <button
                        id={`delete-btn-${tx.id}`}
                        onClick={() => setDeletingTx(tx)}
                        title="Hapus transaksi"
                        className="p-1 px-1.5 bg-rose-50 text-rose-650 rounded-lg hover:bg-rose-600 hover:text-white transition-colors text-[11px]"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL - VIBRANT PALETTE INSPIRED */}
      {deletingTx && (
        <div id="delete-confirmation-overlay" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div id="delete-confirmation-modal" className="bg-white rounded-3xl max-w-md w-full p-8 border border-slate-100 shadow-2xl relative">
            <button
              onClick={() => setDeletingTx(null)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">
                  Hapus Data Transaksi?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus catatan transaksi ini dari Google Sheets Anda? Tindakan ini bersifat permanen dan tidak bisa dibatalkan:
                </p>
              </div>

              {/* Transaction Spec Details Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 inline-block w-full text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Tipe:</span>
                  <span className={`font-bold ${deletingTx.type === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {deletingTx.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Kategori:</span>
                  <span className="font-bold text-slate-800">{deletingTx.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Keterangan:</span>
                  <span className="text-slate-700 font-bold max-w-[200px] truncate">{deletingTx.notes || '-'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-bold">Uang:</span>
                  <span className="font-black text-slate-800">{formatRupiah(deletingTx.amount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  id="cancel-delete-modal-btn"
                  onClick={() => setDeletingTx(null)}
                  disabled={isDeleting}
                  className="w-1/2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-3 rounded-2xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  id="confirm-delete-modal-btn"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="w-1/2 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-2xl text-xs transition-colors shadow-lg shadow-rose-100"
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-rose-300 rounded-full animate-spin"></div>
                  ) : (
                    <span>Hapus Catatan</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
