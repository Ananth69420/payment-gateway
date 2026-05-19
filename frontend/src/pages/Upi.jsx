import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function Upi() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableBanks, setAvailableBanks] = useState([]);

  const [recentPeople, setRecentPeople] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [receiverUpiId, setReceiverUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [successReceipt, setSuccessReceipt] = useState(null);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);

  const [copiedUpi, setCopiedUpi] = useState(false);
  const handleCopyUpi = (upiString) => {
    navigator.clipboard.writeText(upiString);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 1500);
  };

  const navigate = useNavigate();
  const token = localStorage.getItem('bank_auth_token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchAccounts = async () => {
      try {
        setLoading(true);
        let activeAccounts = [];
        let availableBanksFetched = [];
        
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/account`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            activeAccounts = data.accounts || [];
          }
        } catch (e) {
        }

        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/banks`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            availableBanksFetched = data.banks || [];
            setAvailableBanks(availableBanksFetched);
          }
        } catch (e) {
        }

        const savedLocal = localStorage.getItem('local_accounts') || '[]';
        const localAccounts = JSON.parse(savedLocal);

        let apiTransactions = [];
        try {
          const ledgerPromises = activeAccounts.map(async (acc) => {
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
              const matchedAccount = activeAccounts.find(acc => acc.accountId === tx.accountId);
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
        const combinedTxs = [...localTransactions, ...apiTransactions];
        setAllTransactions(combinedTxs);
        
        let apiBeneficiaries = [];
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/beneficiary`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            const rawBeneficiaries = data.beneficiaries || data.data || [];
            apiBeneficiaries = rawBeneficiaries.map(b => {
              const upiId = b.upiId || b.upi || b.beneficiaryUpiId || '';
              const name = b.name || b.beneficiaryName || upiId.split('@')[0];
              const displayName = name.charAt(0).toUpperCase() + name.slice(1);
              return {
                upiId: upiId,
                name: displayName,
                initial: displayName.charAt(0).toUpperCase()
              };
            });
          }
        } catch (e) {
          console.log("Beneficiary API not active yet, using transaction history fallback.");
        }

        if (apiBeneficiaries.length > 0) {
          setRecentPeople(apiBeneficiaries.slice(0, 8));
        } else {
          const uniqueRecipients = [];
          const checkedUpiIds = new Set();
          
          for (const tx of combinedTxs) {
            if (tx.receiverUpiId && !checkedUpiIds.has(tx.receiverUpiId)) {
              checkedUpiIds.add(tx.receiverUpiId);
              const namePart = tx.receiverUpiId.split('@')[0];
              const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
              uniqueRecipients.push({
                upiId: tx.receiverUpiId,
                name: displayName,
                initial: displayName.charAt(0).toUpperCase()
              });
            }
            if (uniqueRecipients.length >= 8) break;
          }
          setRecentPeople(uniqueRecipients);
        }

        const savedAdjustments = localStorage.getItem('balance_adjustments') || '{}';
        const adjustments = JSON.parse(savedAdjustments);
        const username = localStorage.getItem('bank_username') || 'user';

        const mappedApi = activeAccounts.map(acc => {
          const bankInfo = availableBanksFetched.find(b => b.bankId === acc.bankId);
          const bankCodeLower = bankInfo ? bankInfo.code.toLowerCase() : 'bank';
          const suffix = `prob${bankCodeLower}bank`;
          const adjustedBalance = acc.balance - (adjustments[acc.accountId] || 0);
          return {
            ...acc,
            balance: adjustedBalance,
            upiId: acc.upiId || `${username}@${suffix}`
          };
        });

        const mappedLocal = localAccounts.map(acc => {
          const adjustedBalance = acc.balance - (adjustments[acc.accountId] || 0);
          return {
            ...acc,
            accountId: acc.accountId,
            balance: adjustedBalance,
            upiId: acc.upiId
          };
        });
        
        const mergedAccounts = [...mappedApi, ...mappedLocal];

        setAccounts(mergedAccounts);

        if (mergedAccounts.length > 0) {
          setSelectedAccountId(mergedAccounts[0].accountId.toString());
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [token, navigate]);

  const getMutualTransactions = () => {
    if (!activeContact) return [];
    return allTransactions.filter(tx => 
      tx.receiverUpiId === activeContact.upiId || tx.senderUpiId === activeContact.upiId
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const selectedAccount = accounts.find(
    acc => acc.accountId.toString() === selectedAccountId.toString()
  );

  const handleOpenPinModal = (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!selectedAccountId) {
      setSubmitError('Please select a bank account');
      return;
    }
    if (!receiverUpiId.trim() || !receiverUpiId.includes('@')) {
      setSubmitError('Please enter a valid recipient UPI ID (e.g. name@upi)');
      return;
    }

    const cleanedReceiver = receiverUpiId.trim().toLowerCase();
    const isSelfTransfer = accounts.some(acc => acc.upiId && acc.upiId.toLowerCase() === cleanedReceiver);
    if (isSelfTransfer) {
      setSubmitError('Self-transfer is not allowed. You cannot send money to your own linked bank accounts.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid positive transfer amount');
      return;
    }

    if (selectedAccount && selectedAccount.balance < parsedAmount) {
      setSubmitError(`Insufficient funds. Your balance is ₹${selectedAccount.balance}`);
      return;
    }

    setShowPinModal(true);
  };

  const handlePaySubmit = async () => {
    if (!pin.trim()) {
      setSubmitError('Security PIN is required');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      let transactionData = null;

      try {
        const senderUpiHandle = selectedAccount ? selectedAccount.upiId : accounts[0]?.upiId;
        const res = await fetch(`${API_BASE_URL}/api/v1/transaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            senderUpiHandle,
            receiverUpiHandle: receiverUpiId,
            amount: parseFloat(amount)
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          transactionData = {
            transactionId: 'TXN' + Math.floor(Math.random() * 1000000000000),
            receiverUpiId,
            senderUpiId: senderUpiHandle,
            amount: parseFloat(amount),
            bankId: selectedAccount ? selectedAccount.bankId : 1,
            senderAccount: selectedAccountId.toString(),
            timestamp: new Date().toISOString(),
            desc: description || `UPI payment to ${receiverUpiId}`
          };
          
          setAllTransactions(prev => [transactionData, ...prev]);
        } else {
          throw new Error(data.message || 'Payment failed');
        }
      } catch (e) {
        throw e;
      }

      setSuccessReceipt(transactionData);
      setShowPinModal(false);
      setPin('');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getBankName = (bankId) => {
    const bank = availableBanks.find(b => b.bankId === bankId);
    return bank ? bank.name : `Bank ${bankId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center font-semibold text-gray-600">
        Loading payment gateway...
      </div>
    );
  }

  if (successReceipt) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] px-6 py-12 flex items-center justify-center">
        <div className="w-full max-w-xl bg-white rounded-[32px] p-10 shadow-2xl border border-gray-150">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-500 mb-6 shadow-sm">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              Payment Successful!
            </h2>
            <p className="text-gray-500 mt-2">The money has been sent.</p>

            <div className="my-8 bg-[#fafafa] w-full py-6 px-4 rounded-2xl border border-gray-100 flex flex-col items-center">
              <span className="text-sm uppercase tracking-wider text-gray-400 font-semibold">Sent Amount</span>
              <span className="text-5xl font-black mt-2 text-gray-900">
                ₹{parseFloat(successReceipt.amount).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="w-full text-left space-y-4 border-t border-gray-100 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">UPI Ref ID:</span>
                <span className="text-gray-900 font-mono font-bold">{successReceipt.transactionId}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">To (Receiver UPI):</span>
                <span className="text-gray-900 font-semibold">{successReceipt.receiverUpiId}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">From (Sender UPI):</span>
                <span className="text-gray-900 font-semibold">{successReceipt.senderUpiId}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Debited Bank:</span>
                <span className="text-gray-900 font-semibold">{getBankName(successReceipt.bankId)} ({successReceipt.senderAccount})</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Timestamp:</span>
                <span className="text-gray-900 font-medium">
                  {new Date(successReceipt.timestamp).toLocaleString()}
                </span>
              </div>

              {successReceipt.desc && (
                <div className="flex justify-between text-sm border-t border-gray-50 pt-3">
                  <span className="text-gray-400 font-medium">Remarks:</span>
                  <span className="text-gray-800 italic font-medium max-w-xs text-right truncate">
                    {successReceipt.desc}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-10">
              <button
                onClick={() => {
                  setSuccessReceipt(null);
                  setAmount('');
                  setReceiverUpiId('');
                  setDescription('');
                }}
                className="w-full bg-[#f4f1ea] hover:bg-gray-200 text-gray-800 py-3.5 rounded-xl font-semibold transition duration-300"
              >
                Transfer More
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3.5 rounded-xl font-semibold transition duration-300 shadow-md"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-8 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-12">
        <Link to="/home" className="flex items-center">
          <h1
            className="text-4xl font-bold tracking-tight text-[#2563eb]"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Probably<span className="text-black">ABank</span>
          </h1>
        </Link>

        <button
          onClick={() => navigate('/dashboard')}
          className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl transition duration-300 font-semibold"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
        <h2 className="text-5xl font-black tracking-tight text-gray-900 mb-4 leading-none">
          UPI & Transfers
        </h2>
        <p className="text-gray-500 mb-6 max-w-md">
          Send money to anyone instantly using their UPI ID.
        </p>

        <div
          onClick={() => handleCopyUpi(selectedAccount ? selectedAccount.upiId : (accounts[0]?.upiId || ''))}
          className="bg-slate-100 text-slate-700 px-5 py-3.5 rounded-2xl mb-8 flex items-center justify-between text-xs border border-slate-250/60 font-semibold cursor-pointer hover:bg-slate-200/70 transition-all duration-200"
        >
          <span>Your Active UPI Address:</span>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#2563eb] font-mono">
              {selectedAccount ? selectedAccount.upiId : (accounts[0]?.upiId || '')}
            </span>
            <span className="text-[9px] text-[#2563eb]/70 bg-white px-2 py-0.5 rounded border border-blue-100 font-bold">
              {copiedUpi ? 'Copied!' : 'Copy'}
            </span>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200 font-medium">
            {submitError}
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="bg-white rounded-[32px] p-10 shadow-xl border border-gray-200 text-center">
            <div className="w-16 h-16 bg-blue-50 text-[#2563eb] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900">No linked bank accounts</h3>
            <p className="text-gray-500 mt-2 mb-8 leading-6">
              You must link at least one bank account before you can perform a UPI transfer.
            </p>

            <Link
              to="/link-account"
              className="inline-block bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-8 py-3.5 rounded-xl font-bold transition duration-300 shadow-md"
            >
              Link a Bank Account
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-10 shadow-xl border border-gray-200">



            <form onSubmit={handleOpenPinModal} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Debit From Account
                </label>
                <select
                  required
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-semibold text-gray-800"
                >
                  {accounts.map((acc) => (
                    <option key={acc.accountId} value={acc.accountId}>
                      {getBankName(acc.bankId)} (****{acc.accountId.toString().slice(-4)}) - Balance: ₹{acc.balance.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipient UPI ID
                </label>
                <input
                  type="text"
                  required
                  value={receiverUpiId}
                  onChange={(e) => setReceiverUpiId(e.target.value)}
                  placeholder="e.g. friend@okaxis or 9876543210@paytm"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-medium text-gray-800"
                />
                <span className="text-[11px] text-gray-400 mt-1.5 block">
                  Double check the UPI ID before paying.
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transfer Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-black text-2xl text-gray-900"
                  />
                </div>
                {selectedAccount && (
                  <span className="text-[11px] text-gray-500 mt-1.5 block font-medium">
                    Available Balance: ₹{selectedAccount.balance.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add Remarks / Note (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rent, Dinner, Gift, etc."
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-medium text-gray-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] hover:scale-[1.02] text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-md mt-4"
              >
                Proceed to Pay
              </button>
            </form>
          </div>
        )}
        </div>

        <div className="lg:col-span-4">
          {activeContact && (
            <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-gray-50 pb-5 mb-5 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {activeContact.initial}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm">{activeContact.name}</h4>
                    <p className="text-[10px] text-gray-400 font-mono font-bold">{activeContact.upiId}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveContact(null);
                    setReceiverUpiId('');
                  }}
                  className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center text-xs transition duration-200 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto mb-6 pr-2 scrollbar-thin">
                {getMutualTransactions().length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 font-semibold">
                    No previous transactions with this user.
                  </div>
                ) : (
                  getMutualTransactions().map(tx => {
                    const isSent = tx.receiverUpiId === activeContact.upiId;
                    return (
                      <div
                        key={tx.id}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTransaction(tx);
                            setShowTxModal(true);
                          }}
                          className={`max-w-[85%] px-5 py-4 shadow-sm text-left group hover:opacity-90 transition-opacity focus:outline-none ${
                            isSent 
                              ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-[24px] rounded-tr-[6px]' 
                              : 'bg-white text-gray-900 border border-gray-100 rounded-[24px] rounded-tl-[6px]'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-6 mb-2">
                            <span className="text-sm font-black tracking-tight">
                              {isSent ? '-' : '+'} ₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                            </span>
                            <span className={`text-[9px] font-bold tracking-widest uppercase ${isSent ? 'text-white/60' : 'text-gray-400'}`}>
                              {tx.status}
                            </span>
                          </div>
                          <p className={`text-[11px] font-medium leading-relaxed truncate max-w-[220px] ${isSent ? 'text-white/80' : 'text-gray-600'}`}>
                            {tx.desc}
                          </p>
                          <div className={`text-[9px] font-semibold mt-2 flex justify-end ${isSent ? 'text-white/40' : 'text-gray-400'}`}>
                            {new Date(tx.timestamp).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {accounts.length > 0 && recentPeople.length > 0 && (
            <div className={`bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 ${!activeContact ? 'sticky top-8' : ''}`}>
              <h3 className="text-[10px] font-extrabold text-gray-400/80 uppercase tracking-[0.2em] mb-5 px-2">
                Recent Contacts
              </h3>
              <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                {(showAllContacts || recentPeople.length <= 8 ? recentPeople : recentPeople.slice(0, 7)).map((person, index) => {
                  const gradients = [
                    'from-pink-500 to-rose-500',
                    'from-purple-500 to-indigo-500',
                    'from-blue-500 to-cyan-500',
                    'from-teal-500 to-emerald-500',
                    'from-amber-500 to-orange-500'
                  ];
                  const gradient = gradients[index % gradients.length];
                  
                  return (
                    <button
                      key={person.upiId}
                      type="button"
                      onClick={() => {
                        setActiveContact(person);
                        setReceiverUpiId(person.upiId);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex flex-col items-center gap-2 group focus:outline-none"
                    >
                      <div className={`w-14 h-14 bg-gradient-to-tr ${gradient} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        {person.initial}
                      </div>
                      <div className="text-[11px] font-bold text-gray-800 text-center w-full px-1 truncate">
                        {person.name.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}
                
                {!showAllContacts && recentPeople.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllContacts(true)}
                    className="flex flex-col items-center gap-2 group focus:outline-none"
                  >
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 shadow-sm border border-gray-150 group-hover:bg-gray-100 group-hover:scale-110 transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="text-[11px] font-bold text-gray-600 text-center w-full truncate">
                      More
                    </div>
                  </button>
                )}
                
                {showAllContacts && recentPeople.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllContacts(false)}
                    className="flex flex-col items-center gap-2 group focus:outline-none"
                  >
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 shadow-sm border border-gray-150 group-hover:bg-gray-100 group-hover:scale-110 transition-all duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </div>
                    <div className="text-[11px] font-bold text-gray-600 text-center w-full truncate">
                      Less
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[9999]">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-150 shadow-2xl relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h3 className="text-xl font-extrabold text-gray-900">Enter Secure UPI PIN</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Confirm payment from {selectedAccount ? getBankName(selectedAccount.bankId) : 'your account'}.
              </p>

              <div className="my-6 w-full">
                <input
                  type="password"
                  required
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-6 py-4 rounded-xl border border-gray-300 text-center tracking-[0.6em] text-3xl font-black focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-gray-50 focus:bg-white"
                  autoFocus
                />
              </div>

              {submitError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-xs font-semibold w-full border border-red-200">
                  {submitError}
                </div>
              )}

              <div className="w-full grid grid-cols-2 gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPin('');
                    setSubmitError('');
                  }}
                  className="w-full bg-[#f4f1ea] hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold transition duration-300"
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handlePaySubmit}
                  className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3 rounded-xl font-bold transition duration-300 flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? 'Verifying...' : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTxModal && selectedTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[9999]">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-150 shadow-2xl relative">
            <button 
              onClick={() => setShowTxModal(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
            >
              ✕
            </button>
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                selectedTransaction.receiverUpiId === activeContact?.upiId ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
              }`}>
                {selectedTransaction.receiverUpiId !== activeContact?.upiId ? (
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
                selectedTransaction.receiverUpiId === activeContact?.upiId ? 'text-gray-900' : 'text-green-600'
              }`}>
                {selectedTransaction.receiverUpiId === activeContact?.upiId ? '-' : '+'}₹{parseFloat(selectedTransaction.amount).toLocaleString('en-IN')}
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
                  <span className="text-gray-400">Date & Time:</span>
                  <span className="text-gray-900">
                    {new Date(selectedTransaction.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-slate-50 rounded-xl p-4 mt-6 border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Message</span>
                <span className="text-sm font-semibold text-slate-700 break-words">{selectedTransaction.desc}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
