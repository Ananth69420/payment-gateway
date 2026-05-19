import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import BankCard from '../components/BankCard';

const formatAccountNumber = (accountNumber, showFull) => {
  const numStr = accountNumber?.toString() || '';
  if (!numStr) return '';

  const len = numStr.length;
  let groups = [];

  if (len === 9) {
    groups = [3, 3, 3];
  } else if (len === 10) {
    groups = [3, 3, 4];
  } else if (len === 11) {
    groups = [3, 4, 4];
  } else if (len === 12) {
    groups = [4, 4, 4];
  } else {
    // Default group by 4
    for (let i = 0; i < len; i += 4) {
      groups.push(Math.min(4, len - i));
    }
  }

  let targetStr = '';
  if (showFull) {
    targetStr = numStr;
  } else {
    const visibleStartIdx = Math.max(0, len - 4);
    const maskedPart = '*'.repeat(visibleStartIdx);
    const visiblePart = numStr.slice(visibleStartIdx);
    targetStr = maskedPart + visiblePart;
  }

  let result = [];
  let currentIdx = 0;
  for (const groupSize of groups) {
    if (currentIdx >= len) break;
    result.push(targetStr.slice(currentIdx, currentIdx + groupSize));
    currentIdx += groupSize;
  }

  return result.join(' ');
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [selectedBank, setSelectedBank] = useState(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);

  const [copiedText, setCopiedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('All');

  const [showBankModal, setShowBankModal] = useState(false);
  const [availableBanks, setAvailableBanks] = useState([]);

  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementPreset, setStatementPreset] = useState('today');
  const [statementError, setStatementError] = useState('');

  const handleCopyUpi = (upiString) => {
    navigator.clipboard.writeText(upiString);
    setCopiedText(upiString);
    setTimeout(() => setCopiedText(''), 1500);
  };

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [updatingPin, setUpdatingPin] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const nextDigits = [...pinDigits];
      nextDigits[index] = '';
      setPinDigits(nextDigits);
      return;
    }

    const nextDigits = [...pinDigits];
    nextDigits[index] = cleanVal.slice(-1);
    setPinDigits(nextDigits);

    // Auto-focus next input
    if (index < 3) {
      const nextInput = document.getElementById(`pin-digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-digit-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        // Clear previous input
        const nextDigits = [...pinDigits];
        nextDigits[index - 1] = '';
        setPinDigits(nextDigits);
      }
    }
  };

  const handleUpdatePinSubmit = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');

    const newPin = pinDigits.join('');
    if (!/^\d{4}$/.test(newPin)) {
      setUpdateError('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      setUpdatingPin(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/account/update-pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin: parseInt(newPin) })
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateSuccess('Account PIN updated successfully!');
        setPinDigits(['', '', '', '']);
        setTimeout(() => {
          setShowPinModal(false);
          setUpdateSuccess('');
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to update PIN');
      }
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdatingPin(false);
    }
  };

  const getStatementDateRange = () => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (statementPreset === 'today') {
      return { start: todayStart, end: todayEnd };
    }
    if (statementPreset === '7days') {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 6);
      return { start: s, end: todayEnd };
    }
    if (statementPreset === '1month') {
      const s = new Date(todayStart);
      s.setMonth(s.getMonth() - 1);
      return { start: s, end: todayEnd };
    }
    if (statementPreset === '3months') {
      const s = new Date(todayStart);
      s.setMonth(s.getMonth() - 3);
      return { start: s, end: todayEnd };
    }
    if (statementPreset === '6months') {
      const s = new Date(todayStart);
      s.setMonth(s.getMonth() - 6);
      return { start: s, end: todayEnd };
    }
    return null;
  };

  const handleDownloadStatement = () => {
    setStatementError('');
    const range = getStatementDateRange();
    if (!range) {
      setStatementError('Please select a valid date range.');
      return;
    }

    const cleanText = (str) => {
      if (typeof str !== 'string') return '';
      return str.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s+/g, ' ').trim();
    };

    const allTxs = transactions.filter(tx => {
      if (selectedBank && tx.bankId !== selectedBank.bankId) return false;
      const txDate = new Date(tx.timestamp || tx.date);
      return txDate >= range.start && txDate <= range.end;
    });

    const header = ['Date', 'Transaction ID', 'Bank Account', 'Description', 'Type', 'Sender UPI', 'Receiver UPI', 'Amount (INR)', 'Status'];
    const rows = allTxs.map(tx => {
      const bankInfo = linkedBanks.find(b => b.bankId === tx.bankId);
      const bankLabel = bankInfo ? `${bankInfo.bankName} (****${bankInfo.accountNumber?.toString().slice(-4)})` : `Bank ${tx.bankId}`;
      
      const humanType = tx.type === 'Credit' ? 'Received' : 'Sent';
      const humanStatus = tx.status && tx.status.toLowerCase() === 'failed' ? 'Failed' : 'Success';

      return [
        new Date(tx.timestamp || tx.date).toLocaleString('en-IN'),
        tx.transactionId || '',
        cleanText(bankLabel),
        cleanText(tx.description || tx.desc || '').replace(/,/g, ' '),
        humanType,
        tx.senderUpiId || '',
        tx.receiverUpiId || '',
        tx.type === 'Debit' ? `-${parseFloat(tx.amount).toFixed(2)}` : `+${parseFloat(tx.amount).toFixed(2)}`,
        humanStatus
      ];
    });

    const csvContent = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fromStr = range.start.toISOString().slice(0, 10);
    const toStr = range.end.toISOString().slice(0, 10);
    
    const filename = selectedBank
      ? `${cleanText(selectedBank.bankName).replace(/\s+/g, '_')}_Statement_${fromStr}_to_${toStr}.csv`
      : `All_Accounts_Statement_${fromStr}_to_${toStr}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowStatementModal(false);
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

        let userAccounts = [];
        try {
          const accountsRes = await fetch(`${API_BASE_URL}/api/v1/account`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const accountsData = await accountsRes.json();
          if (accountsRes.ok) {
            userAccounts = accountsData.accounts || [];
          }
        } catch (e) {
        }

        let apiTransactions = [];
        try {
          const ledgerPromises = userAccounts.map(async (acc) => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/v1/ledger/download`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ accountId: acc.accountId })
              });
              if (res.ok) {
                const data = await res.json();
                return (data.ledger || []).map(tx => ({
                  ...tx,
                  accountId: acc.accountId,
                  bankId: acc.bankId
                }));
              }
            } catch (e) {
              console.error("Error fetching individual ledger:", e);
            }
            return [];
          });

          const ledgerResults = await Promise.all(ledgerPromises);
          const rawTransactions = ledgerResults.flat();

          apiTransactions = rawTransactions.map((tx, idx) => {
            let bankId = tx.bankId;
            if (!bankId && tx.accountId) {
              const matchedAccount = userAccounts.find(acc => acc.accountId === tx.accountId);
              if (matchedAccount) {
                bankId = matchedAccount.bankId;
              }
            }
            if (!bankId) bankId = 1;

            let type = 'Debit';
            const rawType = tx.entry_type || tx.type || '';
            if (rawType.toLowerCase() === 'credit') {
              type = 'Credit';
            }

            let desc = tx.desc || tx.description || tx.message || '';
            if (!desc) {
              desc = type === 'Credit' ? 'Money Received' : 'Money Sent';
            }

            let descriptionStr = tx.description || tx.desc || tx.message || '';
            if (!descriptionStr) {
              descriptionStr = type === 'Credit'
                ? (tx.senderUpiId ? `Received from ${tx.senderUpiId}` : 'Received Funds')
                : (tx.receiverUpiId ? `Paid to ${tx.receiverUpiId}` : 'Paid Funds');
            }

            return {
              id: tx.ledgerId || tx.transactionId || tx.id || `api-tx-${idx}`,
              transactionId: tx.transactionId || tx.id || `TXN${idx}`,
              bankId: bankId,
              senderUpiId: tx.senderUpiId || 'N/A',
              receiverUpiId: tx.receiverUpiId || 'N/A',
              senderAccount: tx.senderAccount || tx.accountId || 'N/A',
              amount: parseFloat(tx.amount || 0),
              timestamp: tx.timestamp || tx.date || tx.created_at || new Date().toISOString(),
              desc: desc,
              description: descriptionStr,
              type: type,
              status: tx.status ? tx.status.toUpperCase() : 'SUCCESS'
            };
          });
        } catch (e) {
          console.error("Error fetching transactions:", e);
        }

        if (!banksRes.ok) {
          throw new Error(banksData.message || 'Failed to fetch bank brands');
        }

        const availableBanksFetched = banksData.banks || [];
        setAvailableBanks(availableBanksFetched);

        const savedLocal = localStorage.getItem('local_accounts') || '[]';
        const localAccounts = JSON.parse(savedLocal);

        const savedAdjustments = localStorage.getItem('balance_adjustments') || '{}';
        const adjustments = JSON.parse(savedAdjustments);
        const username = localStorage.getItem('bank_username') || 'user';

        const mappedApi = userAccounts.map(acc => {
          const bankInfo = availableBanksFetched.find(b => b.bankId === acc.bankId);
          const bankCodeLower = bankInfo ? bankInfo.code.toLowerCase() : 'bank';
          const suffix = `prob${bankCodeLower}bank`;
          const adjustedBalance = acc.balance - (adjustments[acc.accountId] || 0);
          return {
            id: acc.accountId,
            bankId: acc.bankId,
            bankName: bankInfo ? bankInfo.name : `Bank ${acc.bankId}`,
            bankCode: bankInfo ? bankInfo.code : 'BANK',
            accountNumber: acc.accountNumber || acc.accountId,
            balance: adjustedBalance,
            status: acc.status,
            upiId: acc.upiId || `${username}@${suffix}`
          };
        });

        const mappedLocal = localAccounts.map(acc => {
          const adjustedBalance = acc.balance - (adjustments[acc.accountId] || 0);
          return {
            id: acc.accountId,
            bankId: acc.bankId,
            bankName: acc.bankName,
            bankCode: acc.bankCode,
            accountNumber: acc.accountNumber,
            balance: adjustedBalance,
            status: acc.status,
            upiId: acc.upiId
          };
        });

        setLinkedBanks([...mappedApi, ...mappedLocal]);

        const savedTxs = localStorage.getItem('local_transactions') || '[]';
        let localTransactions = JSON.parse(savedTxs);
        const initialLength = localTransactions.length;
        localTransactions = localTransactions.filter(tx =>
          !tx.senderUpiId?.includes('okaxis') &&
          !tx.receiverUpiId?.includes('okaxis')
        );
        if (localTransactions.length !== initialLength) {
          localStorage.setItem('local_transactions', JSON.stringify(localTransactions));
        }
        const mergedTransactions = [...localTransactions, ...apiTransactions];
        setTransactions(mergedTransactions);
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
        Loading dashboard...
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

  const renderStatementModal = () => {
    if (!showStatementModal) return null;

    const cleanText = (str) => {
      if (typeof str !== 'string') return '';
      return str.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s+/g, ' ').trim();
    };

    const range = getStatementDateRange();
    const matchingTxs = range ? transactions.filter(tx => {
      if (selectedBank && tx.bankId !== selectedBank.bankId) return false;
      const txDate = new Date(tx.timestamp || tx.date);
      return txDate >= range.start && txDate <= range.end;
    }) : [];

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-[36px] p-8 w-full max-w-lg shadow-2xl relative">
          <button
            onClick={() => setShowStatementModal(false)}
            className="absolute top-5 right-5 text-xs font-bold text-gray-400 hover:text-black transition uppercase tracking-wider"
          >
            Close
          </button>

          <p className="uppercase tracking-[0.25em] text-emerald-600 font-bold text-xs">Account Statement</p>

          <h2 className="text-3xl font-black mt-3 text-gray-900 leading-tight">Account Statement</h2>

          <p className="text-gray-500 mt-2 leading-relaxed text-xs">
            Statement for {selectedBank ? `${cleanText(selectedBank.bankName)} Account` : 'All Accounts'}
          </p>

          <div className="mt-6">
            <p className="text-xs font-bold text-gray-700 mb-3">Quick Select Range</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { label: 'Today', value: 'today' },
                { label: 'Last 7 Days', value: '7days' },
                { label: 'Last 1 Month', value: '1month' },
                { label: 'Last 3 Months', value: '3months' },
                { label: 'Last 6 Months', value: '6months' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setStatementPreset(opt.value);
                    setStatementError('');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition duration-200 ${
                    statementPreset === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-700">Transactions ({matchingTxs.length})</span>
              {matchingTxs.length > 0 && (
                <button
                  onClick={handleDownloadStatement}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  Download CSV
                </button>
              )}
            </div>

            {matchingTxs.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 font-semibold bg-gray-50 rounded-2xl border border-gray-100">
                No transactions found for this period.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {matchingTxs.map((tx, idx) => {
                  const humanType = tx.type === 'Credit' ? 'Received' : 'Sent';
                  const humanStatus = tx.status && tx.status.toLowerCase() === 'failed' ? 'Failed' : 'Success';
                  const amtColor = tx.type === 'Credit' ? 'text-green-600' : 'text-gray-900';
                  const amtPrefix = tx.type === 'Credit' ? '+' : '-';
                  
                  return (
                    <div key={tx.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-1.5 font-bold text-gray-800">
                          <span className={`w-1.5 h-1.5 rounded-full ${tx.type === 'Credit' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="truncate">{cleanText(tx.description || tx.desc || 'Transaction')}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                          <span>{new Date(tx.timestamp || tx.date).toLocaleDateString('en-IN')}</span>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{tx.transactionId || 'TXN'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-black text-sm ${amtColor}`}>
                          {amtPrefix}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                        </span>
                        <span className={`block text-[9px] font-bold ${humanStatus === 'Failed' ? 'text-red-500' : 'text-gray-400'}`}>
                          {humanStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!selectedBank) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* NAVBAR */}
        <div className="py-6 flex items-center justify-between mb-8">
          <div>
            <Link to="/home" className="block">
              <h1
                className="text-4xl font-bold tracking-tight text-[#2563eb]"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                Probably<span className="text-black">ABank</span>
              </h1>
            </Link>
            <p className="text-gray-500 mt-1 font-medium">
              Your financial control center.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 px-6 py-3 rounded-2xl font-bold transition"
            >
               Home
            </button>
            <button
  onClick={() => navigate('/upi')}
  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-2xl font-bold transition shadow-lg"
>
  Quick Transfer
</button>
            <button
              onClick={() => {
                setStatementPreset('today');
                setStatementError('');
                setShowStatementModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-md flex items-center"
            >
              <span>Statement</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-black hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-xl transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="bg-gradient-to-br from-[#070b14] via-[#0f172a] to-[#070b14] rounded-[40px] p-12 md:p-16 text-white shadow-[0_20px_50px_rgb(0,0,0,0.15)] overflow-hidden relative mb-16 border border-white/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-[#7dd3fc] text-xs font-extrabold mb-6">
              Dashboard
            </p>
            <h2 className="text-6xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              Banking.<br />
              But less painful.
            </h2>
            <p className="mt-4 text-gray-300 text-lg max-w-xl leading-8">
              Manage accounts, track balances, monitor transactions,
              and move money without opening seventeen tabs.
            </p>
          </div>
        </div>

        <div className="w-full">


          {linkedBanks.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 shadow-xl border border-gray-200 text-center max-w-xl mx-auto">
              <div className="w-20 h-20 bg-blue-50 text-[#2563eb] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900">Link a Bank Account</h3>
              <p className="text-gray-500 mt-3 mb-10 leading-6 max-w-sm mx-auto text-sm">
                You haven&apos;t linked any bank accounts yet. Connect your bank account to start sending UPI transfers.
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

      {renderStatementModal()}
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
              <span className="font-mono text-[15px] font-semibold text-white/85">
                {formatAccountNumber(selectedBank.accountNumber, showAccountNumber)}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAccountNumber(!showAccountNumber);
                  }}
                  className="text-white/80 hover:text-white transition cursor-pointer text-[10px] bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg border border-white/10 font-bold tracking-wider uppercase focus:outline-none"
                  title={showAccountNumber ? "Hide Account Number" : "Show Account Number"}
                >
                  {showAccountNumber ? 'Hide' : 'Show'}
                </button>
                <div className="w-10 h-7 bg-white/20 rounded-md flex items-center justify-center text-[8px] font-bold text-white/60">
                  CHIP
                </div>
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

            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center justify-between w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 px-6 rounded-xl font-bold transition duration-300 shadow-md"
            >
              <span>Update Account PIN</span>
              <span className="text-lg"></span>
            </button>

            <button
              onClick={() => {
                setStatementPreset('today');
                setStatementError('');
                setShowStatementModal(true);
              }}
              className="flex items-center justify-between w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-xl font-bold transition duration-300 shadow-md"
            >
              <span>Download Statement</span>
              <span className="text-lg"></span>
            </button>
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

      {/* ADD BANK MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[36px] p-8 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowBankModal(false)}
              className="absolute top-5 right-5 text-2xl text-gray-400 hover:text-black transition"
            >
              ✕
            </button>

            <p className="uppercase tracking-[0.25em] text-[#2563eb] font-bold text-xs">
              Link A Bank
            </p>

            <h2 className="text-3xl font-bold mt-3">
              Connect your account
            </h2>

            <p className="text-gray-500 mt-2 leading-7 text-sm">
              Login or create an account in one of our supported banks.
            </p>

            <div className="grid grid-cols-1 gap-4 mt-8">
              {availableBanks.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-700">
                    No Banks Available
                  </h3>
                  <p className="text-gray-500 mt-2 text-sm leading-6">
                    There are currently no supported banks available to connect.
                  </p>
                </div>
              ) : (
                availableBanks.map((bank) => (
                  <BankCard
                    key={bank.bankId}
                    bank={bank}
                    onClick={() =>
                      navigate('/link-account', {
                        state: { bank },
                      })
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIN UPDATE MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[36px] p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => {
                setShowPinModal(false);
                setPinDigits(['', '', '', '']);
                setUpdateError('');
                setUpdateSuccess('');
              }}
              className="absolute top-5 right-5 text-2xl text-gray-400 hover:text-black transition"
            >
              ✕
            </button>

            <p className="uppercase tracking-[0.25em] text-[#2563eb] font-bold text-xs">
              Security Settings
            </p>

            <h2 className="text-3xl font-black mt-3 text-gray-900 leading-tight">
              Update Account PIN
            </h2>

            <p className="text-gray-500 mt-2 leading-relaxed text-xs">
              This will update the UPI transaction PIN for all accounts associated with your user.
            </p>

            {updateError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl font-semibold text-xs">
                {updateError}
              </div>
            )}

            {updateSuccess && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl font-semibold text-xs">
                {updateSuccess}
              </div>
            )}

            <form onSubmit={handleUpdatePinSubmit} className="mt-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 text-center">
                  New 4-Digit Secure PIN
                </label>
                <div className="flex justify-center gap-3">
                  {pinDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`pin-digit-${index}`}
                      type="password"
                      inputMode="numeric"
                      required
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      maxLength="1"
                      className="w-12 h-14 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] font-black text-center text-xl transition-all duration-100"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingPin}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3.5 rounded-xl font-bold transition duration-300 shadow-md mt-4 disabled:opacity-50"
              >
                {updatingPin ? 'Updating PIN...' : 'Confirm Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {renderStatementModal()}
    </div>
  );
}
