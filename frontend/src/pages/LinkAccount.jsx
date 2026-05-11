import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
        const banksRes = await fetch('http://localhost:5000/api/v1/banks', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const banksData = await banksRes.json();
        
        const myBanksRes = await fetch('http://localhost:5000/api/my-banks', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const myBanksData = await myBanksRes.json();

        if (!banksRes.ok || !myBanksRes.ok) {
          throw new Error('Failed to fetch bank information');
        }

        setAvailableBanks(banksData.banks || []);
        
        setLinkedBanks(Array.isArray(myBanksData) ? myBanksData : (myBanksData.banks || []));
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const filteredBanks = availableBanks.filter(bank => {
    const isAlreadyLinked = linkedBanks.some(linked => 
      linked.bankId === bank.id || linked.bankName === bank.name
    );
    return !isAlreadyLinked;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!selectedBankId) {
      setSubmitError('Please select a bank');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/link-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bankId: selectedBankId,
          uniqueId: uniqueId,
          password: password
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

  if (loading) return <div>Loading data...</div>;
  if (error) return <div>Error loading options: {error}</div>;

  return (
    <div>
      <h1>Link a New Bank Account</h1>
      
      {submitError && <p style={{ color: 'red' }}>Error: {submitError}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Select Bank: </label>
          <select
            required
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
          >
            <option value="">-- Choose a Bank --</option>
            {filteredBanks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name} ({bank.code})
              </option>
            ))}
          </select>
        </div>

        <br />

        <div>
          <label>Unique ID (Aadhaar/Phone Number): </label>
          <input
            type="text"
            required
            value={uniqueId}
            onChange={(e) => setUniqueId(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>Main App Password: </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <br />

        <button type="submit">Link Bank Account</button>
      </form>
      
      <br />
      <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );
}
