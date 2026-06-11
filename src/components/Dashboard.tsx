import React from 'react';
import { TrendingUp, TrendingDown, Landmark, Sparkles, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '../utils';

interface DashboardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  recentCount: number;
}

export default function Dashboard({ totalIncome, totalExpense, balance, recentCount }: DashboardProps) {
  // Determine spend ratio
  const spendRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  
  // Custom tips based on financial status
  const getStatusDetails = () => {
    if (balance < 0) {
      return {
        bgColor: 'bg-rose-50 border-rose-100',
        textColor: 'text-rose-800',
        iconColor: 'text-rose-500',
        message: 'Pengeluaran Anda telah melebihi pemasukan! Pertimbangkan untuk mengurangi pengeluaran non-esensial beberapa hari ke depan.',
        badge: 'Defisit Terdeteksi',
      };
    } else if (spendRatio > 80) {
      return {
        bgColor: 'bg-amber-50 border-amber-100',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-500',
        message: 'Wah, Anda telah menghabiskan lebih dari 80% dari pemasukan. Cobalah batasi belanja belanja implusif.',
        badge: 'Anggaran Ketat',
      };
    } else if (totalIncome === 0 && totalExpense > 0) {
      return {
        bgColor: 'bg-slate-50 border-slate-100',
        textColor: 'text-slate-800',
        iconColor: 'text-slate-500',
        message: 'Belum ada pemasukan tercatat di periode ini, mulailah menambah pos pendapatan Anda.',
        badge: 'Mulai Menabung',
      };
    } else {
      return {
        bgColor: 'bg-emerald-50 border-emerald-100',
        textColor: 'text-emerald-800',
        iconColor: 'text-emerald-500',
        message: 'Kerja bagus! Keuangan Anda saat ini berada dalam kondisi sehat. Teruskan kebiasaan menabung yang baik.',
        badge: 'Keuangan Sehat',
      };
    }
  };

  const status = getStatusDetails();

  return (
    <div id="dashboard-section" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card: Total Pemasukan */}
        <div id="card-income" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
              Pemasukan
            </span>
            <h3 id="income-value" className="text-3xl font-black text-emerald-500 tracking-tight">
              {formatRupiah(totalIncome)}
            </h3>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full rounded-full"></div>
          </div>
        </div>

        {/* Card: Total Pengeluaran */}
        <div id="card-expense" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
              Pengeluaran
            </span>
            <h3 id="expense-value" className="text-3xl font-black text-rose-500 tracking-tight">
              {formatRupiah(totalExpense)}
            </h3>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(spendRatio, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Rasio anggaran:</span>
              <span className={spendRatio > 80 ? 'text-rose-500' : 'text-slate-500'}>
                {spendRatio.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card: Sisa Saldo - Indigo theme primary */}
        <div 
          id="card-balance" 
          className={`relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between shadow-lg transition-all duration-300 ${
            balance < 0 
              ? 'bg-rose-600 text-white shadow-rose-100' 
              : 'bg-indigo-600 text-white shadow-indigo-200'
          }`}
        >
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <Landmark className="h-28 w-28" />
          </div>
          
          <div>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1 block">
              Sisa Saldo
            </span>
            <h3 id="balance-value" className="text-3xl font-black text-white tracking-tight">
              {formatRupiah(balance)}
            </h3>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {status.badge}
            </span>
            <span className="text-white/80 text-[10px] font-medium">
              {recentCount} transaksi tercatat
            </span>
          </div>
        </div>

      </div>

      {/* Tip Box & Status */}
      <div id="dashboard-advice" className={`border rounded-3xl p-6 flex items-start gap-4 transition-all duration-300 ${status.bgColor}`}>
        <div className={`p-2 rounded-xl bg-white shadow-sm flex-shrink-0 ${status.iconColor}`}>
          {balance < 0 || spendRatio > 80 ? (
            <AlertTriangle className="h-5 w-5 animate-bounce" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>
        <div className="text-sm">
          <h4 className={`font-bold ${status.textColor}`}>Analisis Keuangan</h4>
          <p className="mt-1 leading-relaxed text-slate-600">
            {status.message}
          </p>
        </div>
      </div>
    </div>
  );
}
