import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function LinkAccount() {
  const [availableBanks, setAvailableBanks] = useState([]);
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [selectedBankId, setSelectedBankId] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('bank_auth_token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const banksRes = await fetch(`${API_BASE_URL}/api/v1/banks`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const banksData = await banksRes.json();

        let myBanksData = { accounts: [] };
        let myBanksOk = false;
        try {
          const myBanksRes = await fetch(`${API_BASE_URL}/api/v1/account`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          myBanksData = await myBanksRes.json();
          myBanksOk = myBanksRes.ok;
        } catch (e) {
        }

        if (!banksRes.ok) {
          throw new Error('Failed to fetch bank information');
        }

        const savedLocal = localStorage.getItem('local_accounts') || '[]';
        const localAccounts = JSON.parse(savedLocal);

        setAvailableBanks(banksData.banks || []);
        setLinkedBanks([...(myBanksData.accounts || []), ...localAccounts]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const filteredBanks = availableBanks.filter(bank => {
    return !linkedBanks.some(linked => linked.bankId === bank.bankId);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!selectedBankId) {
      setSubmitError('Please select a bank');
      return;
    }

    if (!/^\d{4}$/.test(password)) {
      setSubmitError('Please enter a valid 4-digit bank account PIN');
      return;
    }

    const cleanedId = uniqueId.trim();
    let bodyPayload = {
      bankId: parseInt(selectedBankId),
      pin: parseInt(password)
    };

    if (/^[6-9]\d{9}$/.test(cleanedId)) {
      bodyPayload.phoneNumber = cleanedId;
    } else {
      setSubmitError('Please enter a valid 10-digit registered phone number');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to link bank account');
      }

      // Fetch the updated accounts to grab the newly created accountId
      const accountsRes = await fetch(`${API_BASE_URL}/api/v1/account`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const accountsData = await accountsRes.json();

      if (accountsRes.ok && accountsData.accounts) {
        // Find the account
        // sorting by accountId descending or just picking the first match 
        const userAccountsForBank = accountsData.accounts.filter(a => a.bankId === parseInt(selectedBankId));
        const newlyCreatedAccount = userAccountsForBank[userAccountsForBank.length - 1]; // Assume the latest

        if (newlyCreatedAccount) {
          await fetch(`${API_BASE_URL}/api/v1/upi`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ accountId: newlyCreatedAccount.accountId })
          });
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  if (loading) return <div>Loading data...</div>;
  if (error) return <div>Error loading options: {error}</div>;

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-8">

      <div className="max-w-7xl mx-auto">

        {/* NAVBAR */}
        <div className="flex items-center justify-between mb-10">

          <div>
            <h1
              className="text-4xl font-bold tracking-tight text-[#2563eb]"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              Probably<span className="text-black">ABank</span>
            </h1>

            <p className="text-gray-500 mt-1 font-medium">
              Securely connect your bank account.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 px-5 py-2.5 rounded-xl font-bold transition"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* LEFT SIDE */}
          <div className="bg-gradient-to-br from-[#070b14] via-[#0f172a] to-[#070b14] rounded-[40px] p-12 text-white shadow-[0_20px_50px_rgb(0,0,0,0.15)] overflow-hidden relative min-h-[650px] flex flex-col justify-between">

            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px]"></div>

            <div className="relative z-10">

              <p className="uppercase tracking-[0.3em] text-[#7dd3fc] text-xs font-extrabold mb-6">
                Link Account
              </p>

              <h2 className="text-6xl font-black leading-[1.05] tracking-tight">
                Banking.
                <br />
                Without the headache.
              </h2>

              <p className="mt-8 text-gray-300 text-lg leading-8 max-w-lg">
                Connect your bank account to access balances,
                transfers, UPI payments, and transaction tracking
                from one unified dashboard.
              </p>

            </div>

            <div className="relative z-10 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6">

              <p className="text-2xl font-bold leading-10">
                “If it involves money,
                <br />
                we probably already automated it.”
              </p>

              <p className="text-gray-400 mt-4 text-sm leading-6">
                Fast onboarding. Secure authentication.
                Zero unnecessary bank drama.
              </p>

            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-white rounded-[36px] shadow-xl border border-gray-200 p-10">

            <p className="uppercase tracking-[0.25em] text-[#2563eb] font-bold text-xs">
              Bank Setup
            </p>

            <h2 className="text-5xl font-black tracking-tight mt-4 text-gray-900">
              Connect your bank
            </h2>

            <p className="text-gray-500 mt-4 leading-7">
              Select a supported bank and securely create/link your account.
            </p>

            {submitError && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-2xl font-semibold">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">

              {/* SELECT BANK */}
              <div>

                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Select Bank
                </label>

                <select
                  required
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-[#2563eb] font-semibold"
                >
                  <option value="">
                    -- Choose a Bank --
                  </option>

                  {filteredBanks.map((bank) => (
                    <option
                      key={bank.bankId}
                      value={bank.bankId}
                    >
                      {bank.name} ({bank.code})
                    </option>
                  ))}
                </select>

              </div>

              {/* PHONE NUMBER */}
              <div>

                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Registered Phone Number
                </label>

                <input
                  type="text"
                  required
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  placeholder="Enter 10-digit registered mobile number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-[#2563eb] font-semibold"
                />

              </div>

              {/* PIN */}
              <div>

                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Account PIN
                </label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength="4"
                  pattern="\d{4}"
                  placeholder="Enter 4-digit secure PIN"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-[#2563eb] font-semibold"
                />

              </div>

              {/* BUTTON */}
              <button
                type="submit"
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-4 rounded-2xl font-black transition duration-300 shadow-lg"
              >
                Link Bank Account
              </button>

            </form>

            {/* ALREADY LINKED */}
            {linkedBanks.length > 0 && (
              <div className="mt-12">

                <h3 className="text-2xl font-black text-gray-900">
                  Already Linked
                </h3>

                <div className="mt-5 space-y-4">

                  {linkedBanks.map((bank) => (
                    <div
                      key={bank.accountId || bank.bankId}
                      className="border border-gray-200 rounded-2xl p-5 flex items-center justify-between bg-gray-50"
                    >

                      <div>

                        <h4 className="font-bold text-lg text-gray-900">
                          {bank.bankName || bank.name}
                        </h4>

                        <p className="text-gray-500 text-sm mt-1">
                          Connected successfully
                        </p>

                      </div>

                      <div className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Active
                      </div>

                    </div>
                  ))}

                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
