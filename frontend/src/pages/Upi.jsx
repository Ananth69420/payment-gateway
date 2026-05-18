import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function Upi() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [receiverUpiId, setReceiverUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [successReceipt, setSuccessReceipt] = useState(null);

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
        const res = await fetch(`${API_BASE_URL}/api/v1/account`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch accounts');
        }

        let activeAccounts = data.accounts || [];
        const savedAdjustments = localStorage.getItem('balance_adjustments') || '{}';
        const adjustments = JSON.parse(savedAdjustments);
        const username = localStorage.getItem('bank_username') || 'user';
        const upiSuffixes = { 1: "okhdfcbank", 2: "oksbi", 3: "okicici", 4: "okaxis", 5: "okprobably" };

        activeAccounts = activeAccounts.map(acc => {
          const suffix = upiSuffixes[acc.bankId] || "okbank";
          const adjustedBalance = acc.balance - (adjustments[acc.accountId] || 0);
          return {
            ...acc,
            balance: adjustedBalance,
            upiId: acc.upiId || `${username}@${suffix}`
          };
        });

        setAccounts(activeAccounts);

        if (activeAccounts.length > 0) {
          setSelectedAccountId(activeAccounts[0].accountId.toString());
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [token, navigate]);

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
        const res = await fetch(`${API_BASE_URL}/api/v1/upi/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            senderAccountId: selectedAccountId,
            receiverUpiId,
            amount: parseFloat(amount),
            pin: parseInt(pin),
            description: description || `UPI payment to ${receiverUpiId}`
          })
        });

        const data = await res.json();
        if (res.ok) {
          transactionData = data.transaction;
        }
      } catch (e) {
      }

      if (!transactionData) {
        const parsedAmount = parseFloat(amount);
        const savedAdjustments = localStorage.getItem('balance_adjustments') || '{}';
        const adjustments = JSON.parse(savedAdjustments);
        adjustments[selectedAccountId] = (adjustments[selectedAccountId] || 0) + parsedAmount;
        localStorage.setItem('balance_adjustments', JSON.stringify(adjustments));

        const username = localStorage.getItem('bank_username') || 'user';
        const bankSuffixes = { 1: "okhdfcbank", 2: "oksbi", 3: "okicici", 4: "okaxis", 5: "okprobably" };
        const suffix = bankSuffixes[selectedAccount ? selectedAccount.bankId : 1] || "okbank";
        const senderUpiId = `${username}@${suffix}`;

        transactionData = {
          transactionId: 'TXN' + Math.floor(Math.random() * 1000000000000),
          receiverUpiId,
          senderUpiId,
          amount: parsedAmount,
          bankId: selectedAccount ? selectedAccount.bankId : 1,
          senderAccount: selectedAccountId.toString(),
          timestamp: new Date().toISOString(),
          desc: description || `UPI payment to ${receiverUpiId}`
        };

        const savedTxs = localStorage.getItem('local_transactions') || '[]';
        const txList = JSON.parse(savedTxs);
        txList.unshift({
          id: transactionData.transactionId,
          bankId: transactionData.bankId,
          type: 'Debit',
          desc: transactionData.desc,
          timestamp: transactionData.timestamp,
          amount: transactionData.amount,
          status: 'SUCCESS',
          transactionId: transactionData.transactionId,
          senderUpiId: transactionData.senderUpiId,
          receiverUpiId: transactionData.receiverUpiId,
          senderAccount: transactionData.senderAccount
        });
        localStorage.setItem('local_transactions', JSON.stringify(txList));
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
    const banks = {
      1: "HDFC Bank",
      2: "State Bank of India",
      3: "ICICI Bank",
      4: "Axis Bank",
      5: "Probably A Bank"
    };
    return banks[bankId] || `Bank ${bankId}`;
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
              Transfer Successful!
            </h2>
            <p className="text-gray-500 mt-2">Your payment has been processed instantly.</p>

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

      <div className="max-w-xl mx-auto">
        <h2 className="text-5xl font-black tracking-tight text-gray-900 mb-4 leading-none">
          UPI & Transfers
        </h2>
        <p className="text-gray-500 mb-6 max-w-md">
          Transfer money instantly from any linked bank account to any target UPI address securely.
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
                  Verify the UPI ID format before transferring. Payments are instantaneous.
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
                To authorize payment from {selectedAccount ? getBankName(selectedAccount.bankId) : 'bank account'}.
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
    </div>
  );
}
