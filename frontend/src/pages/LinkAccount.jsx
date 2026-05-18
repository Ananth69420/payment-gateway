import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function LinkAccount() {
  const [availableBanks, setAvailableBanks] = useState([]);
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [selectedBankId, setSelectedBankId] = useState('');
  const [pin, setPin] = useState('');

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

        const myBanksRes = await fetch(`${API_BASE_URL}/api/v1/account`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const myBanksData = await myBanksRes.json();

        if (!banksRes.ok || !myBanksRes.ok) {
          throw new Error('Failed to fetch bank information');
        }

        setAvailableBanks(banksData.banks || []);
        setLinkedBanks(myBanksData.accounts || []);
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bankId: parseInt(selectedBankId),
          pin: parseInt(pin)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to link bank account');
      }

      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center font-semibold text-gray-600">
        Loading bank partners...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center p-6">
        <div className="bg-white rounded-[28px] p-8 shadow-xl border border-gray-200 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900">Loading Failed</h2>
          <p className="text-gray-500 mt-2 mb-6 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#2563eb] text-white py-3 rounded-xl font-bold transition duration-300"
          >
            Retry
          </button>
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
          Link Bank Account
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Establish a secure connection with any supported retail bank to authorize instantaneous transfers.
        </p>

        {submitError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200 font-medium">
            {submitError}
          </div>
        )}

        {filteredBanks.length === 0 ? (
          <div className="bg-white rounded-[32px] p-10 shadow-xl border border-gray-200 text-center">
            <h3 className="text-2xl font-bold text-gray-900">All banks connected</h3>
            <p className="text-gray-500 mt-2 mb-8 leading-6 text-sm">
              You have already linked all available mock bank accounts to your current profile.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#2563eb] text-white px-8 py-3.5 rounded-xl font-bold transition duration-300 shadow-md"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-10 shadow-xl border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Bank
                </label>
                <select
                  required
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-semibold text-gray-800"
                >
                  <option value="">Choose a Bank</option>
                  {filteredBanks.map((bank) => (
                    <option key={bank.bankId} value={bank.bankId}>
                      {bank.name} ({bank.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Set Secure UPI Transaction PIN
                </label>
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength="6"
                  required
                  placeholder="Enter a 4-6 digit numeric PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] font-medium text-gray-800 placeholder-gray-400"
                />
                <span className="text-[11px] text-gray-400 mt-1.5 block">
                  This secure PIN is required to authorize all payments and transfers made from this account.
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] hover:scale-[1.02] text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-md mt-4"
              >
                Link Bank
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
