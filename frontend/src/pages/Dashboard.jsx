import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BankCard from '../components/BankCard';
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);

  const [showBankModal, setShowBankModal] = useState(false);
  const [availableBanks, setAvailableBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem('bank_auth_token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchMyBanks = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          'http://localhost:5000/api/v1/banks',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to fetch linked banks'
          );
        }

        const banks = Array.isArray(data)
          ? data
          : data.banks || [];

        setLinkedBanks(banks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    const fetchAvailableBanks = async () => {
  try {
    const response = await fetch(
      'http://localhost:5000/api/v1/banks/'
    );

    const data = await response.json();

    if (data.success) {
      setAvailableBanks(data.banks);
    }
  } catch (err) {
    console.log(err);
  }
};

    fetchMyBanks();
    fetchAvailableBanks();
  }, [token, navigate]);

  const fetchTransactions = async (accountId) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/v1/transactions/${accountId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || 'Failed to fetch transactions'
      );
    }

    setTransactions(data.transactions || []);
  } catch (err) {
    console.log(err);
    setTransactions([]);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('bank_auth_token');
    navigate('/login');
  };

  if (!token) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-700">
          Loading Dashboard...
        </h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex flex-col items-center justify-center gap-5">
        <p className="text-red-500 text-xl">
          {error}
        </p>

        <button
          onClick={handleLogout}
          className="bg-black text-white px-6 py-3 rounded-xl"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea]">

      {/* NAVBAR */}
      <div className="px-8 py-6 flex items-center justify-between">

        <div>
          <h1
            className="text-4xl font-bold tracking-tight text-[#2563eb]"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Probably<span className="text-black">ABank</span>
          </h1>

          <p className="text-gray-500 mt-1">
            Your financial control center.
          </p>
        </div>

        <div className="flex items-center gap-4">

          <button
            onClick={() => setShowBankModal(true)}
            className="bg-white border border-gray-300 hover:bg-gray-100 px-5 py-3 rounded-2xl transition"
          >
            + Add Bank
          </button>

          <button
            onClick={handleLogout}
            className="bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-2xl transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="px-8">

        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[36px] p-10 text-white shadow-2xl overflow-hidden relative">

          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">

            <p className="uppercase tracking-[0.25em] text-[#7dd3fc] text-sm">
              Dashboard
            </p>

            <h2 className="text-6xl font-bold mt-5 leading-tight">
              Banking.
              <br />
              But less painful.
            </h2>

            <p className="mt-6 text-gray-300 text-lg max-w-2xl leading-8">
              Manage accounts, track balances, monitor transactions,
              and move money without opening seventeen tabs.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-5 min-w-[220px]">

                <p className="text-gray-400 text-sm">
                  Linked Banks
                </p>

                <h3 className="text-4xl font-bold mt-2">
                  {linkedBanks.length}
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-5 min-w-[220px]">

  <p className="text-gray-400 text-sm">
    Secure Connections
  </p>

  <h3 className="text-4xl font-bold mt-2">
    Active
  </h3>

  <p className="text-[#7dd3fc] mt-4">
    All banks connected securely
  </p>
</div>

<div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-5 min-w-[220px]">

  <p className="text-gray-400 text-sm">
    Supported Banks
  </p>

  <h3 className="text-4xl font-bold mt-2">
    5
  </h3>

  <p className="text-[#7dd3fc] mt-4">
    HDFC • ICICI • SBI • AXIS • CANARA
  </p>
</div>

            </div>
          </div>
        </div>
      </div>

      {/* BANKS SECTION */}
      <div className="px-8 mt-10">

        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Your Banks
            </h2>

            <p className="text-gray-500 mt-2">
              Access and manage linked accounts.
            </p>
          </div>
        </div>

        {linkedBanks.length === 0 ? (
          <div className="bg-white rounded-[32px] p-10 shadow-lg border border-gray-200">

            <h3 className="text-3xl font-bold">
              No linked banks yet.
            </h3>

            <p className="text-gray-500 mt-4 text-lg">
              Add your first bank account to begin.
            </p>

            <button
              onClick={() => setShowBankModal(true)}
              className="mt-8 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-2xl transition"
            >
              Link Your First Bank
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {linkedBanks.map((bank) => (
              <div
                key={bank.id}
                onClick={() => {
                  fetchTransactions(bank.accountId);
                  setSelectedBank(bank);
                }}
                className={`rounded-[30px] p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-xl ${
                  selectedBank?.id === bank.id
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-white'
                }`}
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p
                      className={`text-sm uppercase tracking-[0.2em] ${
                        selectedBank?.id === bank.id
                          ? 'text-blue-100'
                          : 'text-gray-400'
                      }`}
                    >
                      Bank Account
                    </p>

                    <h3 className="text-3xl font-bold mt-4">
                      {bank.bankName}
                    </h3>

                  </div>

                  <div className="text-4xl">
                    🏦
                  </div>
                </div>

                <p
                  className={`mt-8 ${
                    selectedBank?.id === bank.id
                      ? 'text-blue-100'
                      : 'text-gray-500'
                  }`}
                >
                  ****
                  {bank.accountNumber
                    ?.toString()
                    .slice(-4)}
                </p>

                <h2 className="text-4xl font-bold mt-5">
                  ₹{bank.balance}
                </h2>

                <p
                  className={`mt-6 font-medium ${
                    selectedBank?.id === bank.id
                      ? 'text-white'
                      : 'text-[#2563eb]'
                  }`}
                >
                  Open Dashboard →
                </p>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* BANK DASHBOARD */}
      {selectedBank && (
        <div className="px-8 mt-10 pb-10">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">

              {/* ACCOUNT SUMMARY */}
              <div className="bg-white rounded-[32px] p-8 shadow-xl">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
                      Account Summary
                    </p>

                    <h2 className="text-4xl font-bold mt-3">
                      {selectedBank.bankName}
                    </h2>

                    <p className="text-gray-500 mt-4">
                      Account Number: ****
                      {selectedBank.accountNumber
                        ?.toString()
                        .slice(-4)}
                    </p>

                  </div>

                  <div className="bg-[#f4f1ea] rounded-2xl px-6 py-4">

                    <p className="text-gray-500 text-sm">
                      Available Balance
                    </p>

                    <h3 className="text-3xl font-bold text-[#2563eb] mt-2">
                      ₹{selectedBank.balance}
                    </h3>

                  </div>
                </div>
              </div>

              {/* TRANSACTIONS */}
              <div className="bg-white rounded-[32px] p-8 shadow-xl">

                <div className="flex items-center justify-between mb-8">

                  <div>

                    <h3 className="text-3xl font-bold">
                      Recent Transactions
                    </h3>

                    <p className="text-gray-500 mt-2">
                      Latest activity from your account.
                    </p>

                  </div>

                </div>

                <div className="space-y-4">

  {transactions.length === 0 ? (

    <div className="text-center py-10">
      <p className="text-gray-500 text-lg">
        No transactions available
      </p>
    </div>

  ) : (

    transactions.map((tx) => (
      <div
        key={tx.id}
        className="flex items-center justify-between p-5 rounded-2xl hover:bg-gray-50 transition"
      >

        <div className="flex items-center gap-4">

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
              tx.type === 'Credit'
                ? 'bg-green-100'
                : 'bg-red-100'
            }`}
          >
            {tx.type === 'Credit'
              ? '↗'
              : '↙'}
          </div>

          <div>

            <h4 className="font-semibold text-lg">
              {tx.desc}
            </h4>

            <p className="text-gray-500 text-sm mt-1">
              {tx.date}
            </p>

          </div>
        </div>

        <h3
          className={`text-xl font-bold ${
            tx.type === 'Credit'
              ? 'text-green-600'
              : 'text-red-500'
          }`}
        >
          {tx.type === 'Credit'
            ? '+'
            : '-'}
          ₹{tx.amount}
        </h3>
      </div>
    ))

  )}
</div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">

              {/* QUICK ACTIONS */}
              <div className="bg-[#0f172a] text-white rounded-[32px] p-8 shadow-xl">

                <p className="uppercase tracking-[0.2em] text-[#7dd3fc] text-sm">
                  Quick Actions
                </p>

                <div className="space-y-4 mt-8">

                  <button className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] py-4 rounded-2xl font-semibold transition">
                    Transfer Funds
                  </button>

                  <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-semibold transition">
                    Download Statement
                  </button>

                  <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-semibold transition">
                    Add Beneficiary
                  </button>

                  <button
                    onClick={() => setSelectedBank(null)}
                    className="w-full bg-black/20 hover:bg-black/30 py-4 rounded-2xl font-semibold transition"
                  >
                    Switch Bank
                  </button>

                </div>
              </div>

              {/* ACTIVITY CARD */}
              <div className="bg-white rounded-[32px] p-8 shadow-xl">

                <p className="uppercase tracking-[0.2em] text-gray-400 text-sm">
                  Insights
                </p>

                <h3 className="text-3xl font-bold mt-4">
                  Spending increased by 12%
                </h3>

                <p className="text-gray-500 mt-4 leading-8">
                  Most of your spending this month came from
                  shopping and entertainment.
                </p>

                <div className="mt-8">

                  <div className="flex justify-between text-sm mb-2">
                    <span>Shopping</span>
                    <span>62%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-[#2563eb] h-3 rounded-full w-[62%]"></div>
                  </div>

                </div>
              </div>
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
        className="absolute top-5 right-5 text-2xl text-gray-400 hover:text-black"
      >
        ✕
      </button>

      <p className="uppercase tracking-[0.25em] text-[#2563eb] text-sm">
        Link A Bank
      </p>

      <h2 className="text-4xl font-bold mt-4">
        Connect your account
      </h2>

      <p className="text-gray-500 mt-4 leading-8">
        Login or create an account in one of our supported banks.
      </p>

      <div className="grid grid-cols-1 gap-4 mt-8">

        {availableBanks.length === 0 ? (

  <div className="border border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50">

    <h3 className="text-2xl font-bold text-gray-700">
      No Banks Available
    </h3>

    <p className="text-gray-500 mt-3 leading-7">
      There are currently no supported banks available
      to connect.
    </p>

  </div>

) : (

  availableBanks.map((bank) => (
    <BankCard
      key={bank.bankId}
      bank={bank}
      onClick={() =>
        navigate('/LinkAccount', {
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
    </div>
  );
}