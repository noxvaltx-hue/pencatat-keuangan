import React from 'react';
import { Wallet, CheckCircle, Database } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
  isLoggingIn: boolean;
}

export default function AuthScreen({ onLogin, isLoggingIn }: AuthScreenProps) {
  return (
    <div id="auth-container" className="min-h-screen bg-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
          <Wallet id="logo-wallet-icon" className="h-10 w-10 animate-pulse" />
        </div>
        <h2 id="app-title" className="mt-6 text-3xl font-extrabold text-indigo-900 tracking-tight">
          KantongKu
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
          Pencatatan Keuangan Pribadi yang Terintegrasi Langsung dengan Google Sheets
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-indigo-100 sm:px-10">
          <div className="space-y-6">
            <h3 id="panel-title" className="text-lg font-bold text-slate-800 border-b pb-3 border-slate-100">
              Selamat Datang!
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div id="feat-check-1" className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm text-slate-600">
                  <strong className="text-slate-900">Sinkronisasi Otomatis:</strong> Semua catatan disimpan langsung di Google Sheets milik Anda sendiri.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div id="feat-check-2" className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm text-slate-600">
                  <strong className="text-slate-900">Kendali Data Penuh:</strong> Data Anda aman di akun Google Anda, tanpa tersimpan di server pihak ketiga.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div id="feat-check-3" className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm text-slate-600">
                  <strong className="text-slate-900">Laporan Visual:</strong> Dashboard instan untuk melihat sisa saldo, pemasukan, dan pengeluaran Anda.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                id="google-signin-btn"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-2xl border border-slate-200 shadow-sm transition duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoggingIn ? (
                  <div className="h-5 w-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                ) : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                <span>{isLoggingIn ? 'Membuka Sesi...' : 'Masuk dengan Google'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center items-center gap-1 text-xs text-slate-400">
          <Database className="h-3 w-3" />
          <span>Semua dokumen disimpan di Google Drive Anda.</span>
        </div>
      </div>
    </div>
  );
}
