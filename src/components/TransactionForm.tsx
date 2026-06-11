import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, X, Sparkles, Plus, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => Promise<void>;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export default function TransactionForm({
  onSave,
  editingTransaction,
  onCancelEdit,
  isSaving,
}: TransactionFormProps) {
  // Local form state
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Get current state categories
  const categoriesList = type === 'Pemasukan' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // React to editing target
  useEffect(() => {
    if (editingTransaction) {
      setDate(editingTransaction.date);
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setAmount(String(editingTransaction.amount));
      setNotes(editingTransaction.notes);
      setErrorMsg('');
    } else {
      // Reset form (except date remains today, and type remains as is or resets to Pengeluaran)
      setAmount('');
      setNotes('');
      // set category to first in list
      setCategory(type === 'Pemasukan' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
      setErrorMsg('');
    }
  }, [editingTransaction]);

  // Adjust default category if type changes
  useEffect(() => {
    if (!editingTransaction) {
      setCategory(type === 'Pemasukan' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Field validations
    const numAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Masukkan jumlah uang yang valid (lebih dari Rp 0)');
      return;
    }

    if (!date) {
      setErrorMsg('Tanggal transaksi wajib dipilih');
      return;
    }

    if (!category) {
      setErrorMsg('Kategori transaksi wajib dipilih');
      return;
    }

    try {
      const payload = editingTransaction
        ? {
            id: editingTransaction.id,
            date,
            category,
            type,
            amount: numAmount,
            notes,
          }
        : {
            date,
            category,
            type,
            amount: numAmount,
            notes,
          };

      await onSave(payload);
      
      // Reset form if NOT editing
      if (!editingTransaction) {
        setAmount('');
        setNotes('');
        setCategory(type === 'Pemasukan' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi');
    }
  };

  return (
    <div id="transaction-form-card" className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
        <div>
          <h2 id="form-heading" className="text-xl font-black text-slate-800 flex items-center gap-2">
            {editingTransaction ? 'Edit Transaksi' : 'Tambah Data'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">Sinkronisasi otomatis ke Google Sheets.</p>
        </div>
        {editingTransaction && (
          <button
            id="cancel-edit-btn"
            type="button"
            onClick={onCancelEdit}
            className="p-1 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition"
          >
            <X className="h-3 w-3" />
            <span>Batal</span>
          </button>
        )}
      </div>

      <form id="tx-form" onSubmit={handleSubmit} className="space-y-5">
        
        {/* Tipe Transaksi: Segmented Toggle */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Tipe Transaksi
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              id="type-toggle-pemasukan"
              type="button"
              onClick={() => setType('Pemasukan')}
              className={`py-3 px-4 rounded-2xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 ${
                type === 'Pemasukan'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-transparent bg-slate-50 text-slate-550 hover:bg-slate-100'
              }`}
            >
              <span>Pemasukan</span>
            </button>
            <button
              id="type-toggle-pengeluaran"
              type="button"
              onClick={() => setType('Pengeluaran')}
              className={`py-3 px-4 rounded-2xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 ${
                type === 'Pengeluaran'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-transparent bg-slate-50 text-slate-550 hover:bg-slate-100'
              }`}
            >
              <span>Pengeluaran</span>
            </button>
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Tanggal</span>
            </label>
            <input
              id="input-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
            />
          </div>

          {/* Jumlah Uang */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>Jumlah Uang (Rp)</span>
            </label>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold text-sm">Rp</span>
              </div>
              <input
                id="input-amount"
                type="number"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl py-3 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Kategori */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>Kategori</span>
            </label>
            <select
              id="input-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Keterangan */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Keterangan</span>
            </label>
            <input
              id="input-notes"
              type="text"
              placeholder="Detail transaksi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        {errorMsg && (
          <div id="form-error" className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 text-xs text-rose-700 font-bold">
            {errorMsg}
          </div>
        )}

        <div className="pt-2">
          <button
            id="btn-submit-tx"
            type="submit"
            disabled={isSaving}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="h-5 w-5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
            ) : editingTransaction ? (
              <Edit3 className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>
              {isSaving ? 'Menyimpan ke Google Sheet...' : editingTransaction ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
            </span>
          </button>
        </div>

      </form>
    </div>
  );
}
