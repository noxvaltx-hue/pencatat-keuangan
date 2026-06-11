import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  LogOut, 
  Database, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, setCachedAccessToken } from './firebase';
import { 
  getOrCreateSpreadsheet, 
  fetchTransactionsFromSheet, 
  appendTransactionToSheet, 
  updateTransactionInSheet, 
  deleteTransactionFromSheet 
} from './sheetsService';
import { Transaction, SheetInfo } from './types';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';

export default function App() {
  // Authentication & Session States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Google Sheets integration state
  const [sheetInfo, setSheetInfo] = useState<SheetInfo | null>(null);
  const [sheetLoading, setSheetLoading] = useState<boolean>(false);
  const [sheetError, setSheetError] = useState<string>('');

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txSaving, setTxSaving] = useState<boolean>(false);
  const [txDeleting, setTxDeleting] = useState<boolean>(false);
  
  // Edit Mode state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  /**
   * Monitor Firebase Authentication state on startup.
   */
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, cachedToken) => {
        setUser(currentUser);
        setToken(cachedToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  /**
   * Automatically search or build the Google Sheet once authenticated.
   */
  useEffect(() => {
    if (token && user) {
      loadSheetIntegration(token);
    } else {
      setSheetInfo(null);
      setTransactions([]);
    }
  }, [token, user]);

  /**
   * Wrapper to check & load our Google Sheets file.
   */
  const loadSheetIntegration = async (accessToken: string) => {
    setSheetLoading(true);
    setSheetError('');
    try {
      const info = await getOrCreateSpreadsheet(accessToken);
      setSheetInfo(info);
      
      // Load current transactions from this sheet
      await reloadTransactions(info, accessToken);
    } catch (err: any) {
      console.error('Sheet configuration error:', err);
      // If unauthorized (401), token may be expired - resetauth and let user login again
      if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('invalid credentials'))) {
        handleExpiredToken();
      } else {
        setSheetError(err.message || 'Gagal menghubungkan dokumen Google Sheets.');
      }
    } finally {
      setSheetLoading(false);
    }
  };

  /**
   * Synchronizes and loads all transactions from the spreadsheet.
   */
  const reloadTransactions = async (info = sheetInfo, accessToken = token) => {
    if (!info || !accessToken) return;
    setTxLoading(true);
    try {
      const list = await fetchTransactionsFromSheet(info, accessToken);
      setTransactions(list);
    } catch (err: any) {
      console.error('Reload transactions error:', err);
      if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized'))) {
        handleExpiredToken();
      } else {
        setSheetError('Sesi terputus atau gagal memuat data transaksi.');
      }
    } finally {
      setTxLoading(false);
    }
  };

  /**
   * Handles 401 token expiry by resetting auth and informing the user.
   */
  const handleExpiredToken = () => {
    setToken(null);
    setCachedAccessToken(null);
    setUser(null);
    setNeedsAuth(true);
    setSheetInfo(null);
    setTransactions([]);
    alert('Sesi Google Sheets Anda telah berakhir. Silakan masuk kembali.');
  };

  /**
   * Initiates Google Sign In popup.
   */
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setToken(res.accessToken);
        setUser(res.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login action failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  /**
   * Initiates logout.
   */
  const handleLogout = async () => {
    try {
      await logout();
      setToken(null);
      setUser(null);
      setNeedsAuth(true);
      setSheetInfo(null);
      setTransactions([]);
    } catch (err) {
      console.error('Log out action failed:', err);
    }
  };

  /**
   * Adds a new transaction or updates an existing transaction in the spreadsheet.
   */
  const handleSaveTransaction = async (formPayload: Omit<Transaction, 'id'> | Transaction) => {
    if (!sheetInfo || !token) {
      alert('Sambungan Google Sheet tidak tersedia. Silakan segarkan halaman.');
      return;
    }
    
    setTxSaving(true);
    try {
      if ('id' in formPayload) {
        // Edit flow
        await updateTransactionInSheet(sheetInfo, formPayload as Transaction, token);
        setEditingTransaction(null);
      } else {
        // Create flow
        const newTransaction: Transaction = {
          ...formPayload,
          id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        };
        await appendTransactionToSheet(sheetInfo, newTransaction, token);
      }
      
      // Refresh transactions state from actual Google Sheet
      await reloadTransactions(sheetInfo, token);
    } catch (err: any) {
      console.error('Save transaction error:', err);
      alert('Gagal menyimpan transaksi ke Google Sheets: ' + err.message);
    } finally {
      setTxSaving(false);
    }
  };

  /**
   * Deletes a transaction row securely.
   */
  const handleDeleteTransaction = async (id: string) => {
    if (!sheetInfo || !token) return;
    setTxDeleting(true);
    try {
      await deleteTransactionFromSheet(sheetInfo, id, token);
      // Refresh transactions state
      await reloadTransactions(sheetInfo, token);
    } catch (err: any) {
      console.error('Delete transaction error:', err);
      alert('Gagal menghapus transaksi dari Google Sheets: ' + err.message);
    } finally {
      setTxDeleting(false);
    }
  };

  // Compute metrics in high performance hook mapping
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'Pemasukan') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [transactions]);

  // Handle Loading/Auth layout transitions
  if (needsAuth) {
    return <AuthScreen onLogin={handleLogin} isLoggingIn={isLoggingIn} />;
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* HEADER BAR IN MODERN INDIGO VIBRANT THEME */}
      <header id="main-header" className="bg-indigo-600 text-white shadow-xl shadow-indigo-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div id="header-wallet-icon-box" className="p-2.5 bg-white/20 rounded-xl flex items-center justify-center text-white shadow-inner">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 id="app-heading-headline" className="text-xl font-black tracking-tight">KantongKu</h1>
              <p className="text-xs text-indigo-200">Pencatatan Keuangan Pribadi</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3.5 w-full sm:w-auto">
            
            {/* Google Sheets Status Tracker */}
            {sheetInfo ? (
              <a
                id="google-sheet-link"
                href={`https://docs.google.com/spreadsheets/d/${sheetInfo.spreadsheetId}/edit`}
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white border border-indigo-500/80 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-sm"
                title="Buka dokumen di tab baru"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></div>
                <span>Google Sheet Terhubung</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : sheetLoading ? (
              <div className="flex items-center gap-2 bg-indigo-700/80 border border-indigo-500/50 px-4 py-2 rounded-2xl text-xs font-bold text-indigo-100 animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin text-white" />
                <span>Menghubungkan Sheets...</span>
              </div>
            ) : sheetError ? (
              <div className="flex items-center gap-2 bg-rose-750/80 border border-rose-500/50 text-rose-100 px-4 py-2 rounded-2xl text-xs font-bold">
                <AlertCircle className="h-3.5 w-3.5 text-white" />
                <span>Sheets Gagal</span>
              </div>
            ) : null}

            {/* User Profile Info */}
            <div className="flex items-center gap-2.5 border-l border-indigo-500 pl-3.5">
              {user?.photoURL ? (
                <img
                  id="user-avatar-img"
                  src={user.photoURL}
                  referrerPolicy="no-referrer"
                  alt={user.displayName || 'User Avatar'}
                  className="h-9 w-9 rounded-full border border-white/20 object-cover shadow-sm bg-white"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-white text-indigo-650 font-black flex items-center justify-center text-xs shadow-sm">
                  {user?.displayName ? user.displayName.substring(0, 1).toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden md:block text-left">
                <span className="block text-xs font-black text-white truncate max-w-[120px]">
                  {user?.displayName || 'User'}
                </span>
                <span className="block text-[10px] text-indigo-200 truncate max-w-[120px]">
                  {user?.email || ''}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              id="header-logout-btn"
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-indigo-700 hover:bg-rose-600 hover:text-white text-white flex items-center justify-center transition border border-indigo-500/50"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>

          </div>
        </div>
      </header>

      {/* REFRESH/SYNC LOADING BLOCK OVERLAYS */}
      {sheetLoading && (
        <div id="full-sync-loader" className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-slate-800 text-sm">Menghubungkan Google Sheets</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mencari atau membuat file pencatatan keuangan <strong className="text-slate-700 font-semibold">"Pencatatan Keuangan Pribadi (Keuangan App)"</strong> di Google Drive Anda...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ERROR CONFIGURATION BOXES */}
      {!sheetLoading && sheetError && (
        <div id="full-sync-error" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-start gap-4">
            <div className="p-3 bg-white shadow-xs rounded-xl text-rose-600 flex-shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-rose-800 text-sm">Koneksi Spreadsheet Gagal</h4>
              <p className="text-xs text-rose-600 leading-relaxed">
                Detail canangan error: <strong className="font-normal font-mono">{sheetError}</strong>
              </p>
              <button
                id="retry-sheet-connection-btn"
                onClick={() => loadSheetIntegration(token!)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Coba Hubungkan Kembali</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT PAGE */}
      {!sheetLoading && !sheetError && sheetInfo && (
        <main id="app-workspace" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Dashboard Metrics (Top Block) */}
          <section id="metrik-analisis-row">
            <Dashboard 
              totalIncome={metrics.totalIncome} 
              totalExpense={metrics.totalExpense} 
              balance={metrics.balance}
              recentCount={transactions.length}
            />
          </section>

          {/* Form & Actions Block (Bottom Split) */}
          <div id="pencatatan-transaksi-workspace-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Form Input (Cols Span 4) */}
            <section id="form-container-col" className="lg:col-span-4 lg:sticky lg:top-24">
              <TransactionForm
                onSave={handleSaveTransaction}
                editingTransaction={editingTransaction}
                onCancelEdit={() => setEditingTransaction(null)}
                isSaving={txSaving}
              />
            </section>

            {/* List & Filters (Cols Span 8) */}
            <section id="history-container-col" className="lg:col-span-8 relative">
              
              {/* Optional Table-level Reloading spinner overlay */}
              {txLoading && (
                <div id="tx-loading-blur-overlay" className="absolute inset-0 bg-white/75 backdrop-blur-xs flex items-center justify-center z-10 rounded-3xl">
                  <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg shadow-slate-900/10 text-xs font-semibold">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    <span>Sinkronisasi Google Sheets...</span>
                  </div>
                </div>
              )}

              <TransactionList
                transactions={transactions}
                onEdit={(tx) => {
                  setEditingTransaction(tx);
                  // Scroll to form smoothly
                  document.getElementById('transaction-form-card')?.scrollIntoView({ behavior: 'smooth' });
                }}
                onDelete={handleDeleteTransaction}
                isDeleting={txDeleting}
              />
            </section>

          </div>

        </main>
      )}

      {/* FOOTER METADATA (VIBRANT PALETTE CLEAN MINIMALIST FOOTER) */}
      <footer id="app-footer" className="mt-auto bg-white border-t border-slate-100 text-slate-450 py-6 text-center text-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 KantongKu. Semua data disimpan aman secara pribadi di GDrive Google Sheets Anda.</p>
          {sheetInfo && (
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
              <Database className="h-3 w-3 text-indigo-500" />
              <span>Spreadsheet ID: </span>
              <span className="font-mono text-[10px] text-slate-400 select-all font-normal">
                {sheetInfo.spreadsheetId.substring(0, 8)}...{sheetInfo.spreadsheetId.substring(sheetInfo.spreadsheetId.length - 8)}
              </span>
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}
