import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [selectedBank, setSelectedBank] = useState(null);
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);

  const [copiedText, setCopiedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('All');

  const handleCopyUpi = (upiString) => {
    navigator.clipboard.writeText(upiString);
    setCopiedText(upiString);
    setTimeout(() => setCopiedText(''), 1500);
  };

  const navigate = useNavigate();
  const token = localStorage.getItem('bank_auth_token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const banksRes = await fetch(`${API_BASE_URL}/api/v1/banks`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const banksData = await banksRes.json();

        const accountsRes = await fetch(`${API_BASE_URL}/api/v1/account`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const accountsData = await accountsRes.json();

        const transactionsRes = await fetch(`${API_BASE_URL}/api/v1/upi/transactions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const transactionsData = await transactionsRes.json();

        if (!banksRes.ok) {
          throw new Error(banksData.message || 'Failed to fetch bank brands');
        }
        if (!accountsRes.ok) {
          throw new Error(accountsData.message || 'Failed to fetch linked accounts');
        }
        if (!transactionsRes.ok) {
          throw new Error(transactionsData.message || 'Failed to fetch transaction logs');
        }

        const availableBanks = banksData.banks || [];
        const userAccounts = accountsData.accounts || [];

        const mapped = userAccounts.map(acc => {
          const bankInfo = availableBanks.find(b => b.bankId === acc.bankId);
          const upiSuffixes = { 1: "okhdfcbank", 2: "oksbi", 3: "okicici", 4: "okaxis", 5: "okprobably" };
          const suffix = upiSuffixes[acc.bankId] || "okbank";
          return {
            id: acc.accountId,
            bankId: acc.bankId,
            bankName: bankInfo ? bankInfo.name : `Bank ${acc.bankId}`,
            bankCode: bankInfo ? bankInfo.code : 'BANK',
            accountNumber: acc.accountId,
            balance: acc.balance,
            status: acc.status,
            upiId: acc.upiId || `user@${suffix}`
          };
        });

        setLinkedBanks(mapped);
        setTransactions(transactionsData.transactions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('bank_auth_token');
    navigate('/login');
  };

  const getBankColor = (bankId) => {
    const colors = {
      1: "from-blue-700 to-indigo-900", 
      2: "from-emerald-700 to-teal-900", 
      3: "from-orange-600 to-red-900", 
      4: "from-purple-700 to-fuchsia-950", 
    };
    return colors[bankId] || "from-slate-700 to-slate-900";
  };

  if (!token) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center font-semibold text-gray-600">
        Syncing banking dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center p-6">
        <div className="bg-white rounded-[28px] p-8 shadow-xl border border-gray-200 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Connection Error</h2>
          <p className="text-gray-500 mt-2 mb-8 text-sm leading-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3 rounded-xl font-bold transition duration-300"
            >
              Retry Connection
            </button>
            <button 
              onClick={handleLogout} 
              className="w-full bg-[#f4f1ea] hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold transition duration-300"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedBank) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between mb-14">
          <Link to="/home">
            <h1
              className="text-4xl font-bold tracking-tight text-[#2563eb]"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              Probably<span className="text-black">ABank</span>
            </h1>
          </Link>
          <div className="flex gap-4">
            <Link
              to="/home"
              className="bg-white hover:bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl font-semibold border border-gray-200 transition duration-300"
            >
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-300"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
            Welcome to banking.
          </h2>
          <p className="text-gray-500 mb-12 max-w-md mx-auto">
            Choose which active linked bank account you want to open and manage from your unified dashboard.
          </p>

          {linkedBanks.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 shadow-xl border border-gray-200 text-center max-w-xl mx-auto">
              <div className="w-20 h-20 bg-blue-50 text-[#2563eb] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">Link a Bank Account</h3>
              <p className="text-gray-500 mt-3 mb-10 leading-6 max-w-sm mx-auto text-sm">
                You haven&apos;t linked any bank account yet. Securely connect your active banking credentials to start sending UPI transfers.
              </p>
              <Link
                to="/link-account"
                className="inline-block bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-8 py-4 rounded-xl font-bold transition duration-300 shadow-md"
              >
                Link Your Account
              </Link>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-left">
                {linkedBanks.map((bank) => (
                  <div
                    key={bank.id}
                    onClick={() => setSelectedBank(bank)}
                    className={`bg-gradient-to-br ${getBankColor(bank.bankId)} text-white p-8 rounded-[28px] shadow-lg cursor-pointer transform hover:scale-[1.03] transition-all duration-300 h-64 flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">
                          Linked Bank
                        </span>
                        <span className="font-extrabold tracking-tight text-white/80">{bank.bankCode}</span>
                      </div>
                      <h3 className="text-3xl font-extrabold mt-3">{bank.bankName}</h3>
                      <p className="text-sm font-mono mt-1 text-white/70">
                        Account: ****{bank.accountNumber?.toString().slice(-4)}
                      </p>
                      <p className="text-xs font-mono mt-1.5 text-white/60 bg-white/10 py-1 px-2.5 rounded-lg inline-block">
                        UPI: {bank.upiId}
                      </p>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-2">
                      <div>
                        <span className="text-[10px] uppercase text-white/50 block font-semibold">Balance</span>
                        <span className="text-2xl font-black">
                          ₹{parseFloat(bank.balance).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md">
                        Open
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="inline-block">
                <Link
                  to="/link-account"
                  className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 px-6 py-3 rounded-2xl border border-gray-200 transition duration-300 font-bold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Link Another Bank
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(tx => {
    if (tx.bankId !== selectedBank.bankId) return false;
    if (filterTab === 'Debit' && tx.type !== 'Debit') return false;
    if (filterTab === 'Credit' && tx.type !== 'Credit') return false;
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.desc?.toLowerCase().includes(q) || tx.description?.toLowerCase().includes(q);
      const matchUpi = tx.senderUpiId?.toLowerCase().includes(q) || tx.receiverUpiId?.toLowerCase().includes(q);
      const matchAmt = tx.amount?.toString().includes(q);
      const matchRef = tx.transactionId?.toLowerCase().includes(q);
      return matchDesc || matchUpi || matchAmt || matchRef;
    }
    return true;
  });

  const handleOpenTxDetails = (tx) => {
    setSelectedTransaction(tx);
    setShowTxModal(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-12">
        <Link to="/home">
          <h1
            className="text-4xl font-bold tracking-tight text-[#2563eb]"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Probably<span className="text-black">ABank</span>
          </h1>
        </Link>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedBank(null)}
            className="bg-white hover:bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl font-semibold border border-gray-200 transition duration-300"
          >
            Switch Bank
          </button>
          <button
            onClick={handleLogout}
            className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-300"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex flex-col md:flex-row md:items-center justify-between gap-4">
            <span>{selectedBank.bankName} Account</span>
            <span 
              onClick={() => handleCopyUpi(selectedBank.upiId)}
              className="text-[11px] bg-blue-50 text-[#2563eb] font-bold px-3.5 py-1.5 rounded-full border border-blue-100 font-mono flex items-center gap-2 cursor-pointer hover:bg-blue-100 transition-all duration-200"
            >
              UPI: {selectedBank.upiId}
              <span className="text-[9px] text-[#2563eb]/70 bg-white px-1.5 py-0.5 rounded border border-blue-100 font-bold">
                {copiedText === selectedBank.upiId ? 'Copied!' : 'Copy'}
              </span>
            </span>
          </h2>

          <div className={`bg-gradient-to-br ${getBankColor(selectedBank.bankId)} text-white p-8 rounded-[32px] shadow-2xl h-64 flex flex-col justify-between relative overflow-hidden border border-white/10`}>
            <div className="absolute right-0 top-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Active Account</span>
                  <span className="font-extrabold text-white/90 text-sm mt-0.5 block">{selectedBank.bankName}</span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider font-bold">
                  {selectedBank.bankCode}
                </div>
              </div>
              
              <div className="mt-8">
                <span className="text-[10px] uppercase text-white/40 block font-semibold">Current Balance</span>
                <span className="text-4xl font-black mt-1 block">
                  ₹{parseFloat(selectedBank.balance).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-2">
              <span className="font-mono text-sm tracking-widest text-white/70">
                **** **** **** {selectedBank.accountNumber?.toString().slice(-4)}
              </span>
              <div className="w-10 h-7 bg-white/20 rounded-md flex items-center justify-center text-[8px] font-bold text-white/60">
                CHIP
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg space-y-4">
            <h4 className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-2">Quick Actions</h4>
            
            <Link
              to="/upi"
              className="flex items-center justify-between w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3.5 px-6 rounded-xl font-bold transition duration-300 shadow-md"
            >
              <span>Instant UPI Transfer</span>
              <span className="text-lg"></span>
            </Link>

            <Link
              to="/link-account"
              className="flex items-center justify-between w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-6 rounded-xl font-bold transition duration-300"
            >
              <span>Link New Bank Account</span>
              <span className="text-lg"></span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              Recent Ledger
            </h3>
            
            <div className="flex bg-gray-155/60 p-1 rounded-xl border border-gray-200">
              {['All', 'Debit', 'Credit'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 ${
                    filterTab === tab
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-150'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab === 'All' ? 'All' : tab === 'Debit' ? 'Sent' : 'Received'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-150 bg-gray-50/50">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by note, UPI ID, or transaction ID..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-xs font-semibold text-gray-800 placeholder-gray-400"
              />
            </div>
            
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-semibold text-gray-800">No transaction logs</p>
                <p className="text-xs text-gray-400 mt-1">Transfers you perform from this bank will show up here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-4 px-6 text-xs uppercase tracking-wider text-gray-400 font-bold">Transaction</th>
                      <th className="py-4 px-6 text-xs uppercase tracking-wider text-gray-400 font-bold text-center">Type</th>
                      <th className="py-4 px-6 text-xs uppercase tracking-wider text-gray-400 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        onClick={() => handleOpenTxDetails(tx)}
                        className="hover:bg-slate-50/70 transition-colors duration-200 cursor-pointer group"
                      >
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full ${tx.type === 'Credit' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <div>
                              <p className="font-bold text-gray-800 group-hover:text-[#2563eb] transition duration-200">
                                {tx.desc}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                {new Date(tx.timestamp || tx.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4.5 px-6 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                            tx.type === 'Credit' 
                              ? 'bg-green-50 text-green-700 border border-green-200/50' 
                              : 'bg-red-50 text-red-700 border border-red-200/50'
                          }`}>
                            {tx.type}
                          </span>
                        </td>

                        <td className="py-4.5 px-6 text-right font-black text-gray-900 text-lg">
                          {tx.type === 'Credit' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-gray-50/50 py-4 px-6 border-t border-gray-100 text-center">
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                Click on any transaction record to view full receipt details.
              </span>
            </div>
          </div>
        </div>
      </div>

      {showTxModal && selectedTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[9999]">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-150 shadow-2xl relative">
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                selectedTransaction.type === 'Credit' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
              }`}>
                {selectedTransaction.type === 'Credit' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </div>

              <span className="text-xs uppercase tracking-widest text-gray-400 font-extrabold">Transaction Receipt</span>
              
              <h3 className={`text-4xl font-black mt-2 ${
                selectedTransaction.type === 'Credit' ? 'text-green-600' : 'text-gray-900'
              }`}>
                {selectedTransaction.type === 'Credit' ? '+' : '-'}₹{parseFloat(selectedTransaction.amount).toLocaleString('en-IN')}
              </h3>
              
              <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase mt-2.5 border border-green-200/50">
                {selectedTransaction.status || 'SUCCESS'}
              </div>

              <div className="w-full mt-8 space-y-4 border-t border-b border-gray-100 py-6">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-400">Ref ID:</span>
                  <span className="text-gray-900 font-mono">{selectedTransaction.transactionId || 'N/A'}</span>
                </div>

                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-400">Sender UPI:</span>
                  <span className="text-gray-900">{selectedTransaction.senderUpiId || 'N/A'}</span>
                </div>

                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-400">Receiver UPI:</span>
                  <span className="text-gray-900">{selectedTransaction.receiverUpiId || 'N/A'}</span>
                </div>

                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-400">Sender Bank Account:</span>
                  <span className="text-gray-900 font-mono">
                    {selectedBank.bankName} ({selectedTransaction.senderAccount || 'N/A'})
                  </span>
                </div>

                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-400">Time & Date:</span>
                  <span className="text-gray-900">
                    {new Date(selectedTransaction.timestamp || selectedTransaction.date).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {selectedTransaction.description && (
                  <div className="flex justify-between text-xs font-semibold border-t border-gray-50 pt-3">
                    <span className="text-gray-400">Description:</span>
                    <span className="text-gray-800 italic max-w-[200px] text-right truncate">
                      {selectedTransaction.description}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowTxModal(false);
                  setSelectedTransaction(null);
                }}
                className="w-full bg-[#f4f1ea] hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold transition duration-300 mt-6 shadow-sm"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
