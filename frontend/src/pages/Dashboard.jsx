import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkedBanks, setLinkedBanks] = useState([]);

  const [selectedBank, setSelectedBank] = useState(null);

  const dummyTransactions = [
    { id: 101, date: '2026-05-10', desc: 'Supermart', type: 'Debit', amount: 1200 },
    { id: 102, date: '2026-05-09', desc: 'Salary Credit', type: 'Credit', amount: 45000 },
    { id: 103, date: '2026-05-08', desc: 'Electricity Bill', type: 'Debit', amount: 3400 },
  ];

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

        // 1. Fetch available bank brands
        const banksRes = await fetch('http://localhost:5000/api/v1/banks', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const banksData = await banksRes.json();

        // 2. Fetch user's linked accounts
        const accountsRes = await fetch('http://localhost:5000/api/v1/account', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const accountsData = await accountsRes.json();

        if (!banksRes.ok) {
          throw new Error(banksData.message || 'Failed to fetch bank brands');
        }
        if (!accountsRes.ok) {
          throw new Error(accountsData.message || 'Failed to fetch linked accounts');
        }

        const availableBanks = banksData.banks || [];
        const userAccounts = accountsData.accounts || [];

        // 3. Map accounts together with bank brands
        const mapped = userAccounts.map(acc => {
          const bankInfo = availableBanks.find(b => b.bankId === acc.bankId);
          return {
            id: acc.accountId,
            bankId: acc.bankId,
            bankName: bankInfo ? bankInfo.name : `Bank ${acc.bankId}`,
            accountNumber: acc.accountId,
            balance: acc.balance,
            status: acc.status
          };
        });

        setLinkedBanks(mapped);
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

  if (!token) return null;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (!selectedBank) {
    return (
      <div>
        <h1>Select Your Bank</h1>
        <button onClick={handleLogout}>Logout</button>
        <hr />

        {linkedBanks.length === 0 ? (
          <div>
            <p>You have no linked bank accounts.</p>
            <Link to="/link-account">Link an Account</Link>
          </div>
        ) : (
          <div>
            <p>Choose an active bank to view dashboard:</p>
            <select onChange={(e) => {
              const bank = linkedBanks.find(b => b.id.toString() === e.target.value.toString());
              if (bank) setSelectedBank(bank);
            }} defaultValue="">
              <option value="" disabled>-- Select Bank --</option>
              {linkedBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>{bank.bankName} (****{bank.accountNumber?.toString().slice(-4)})</option>
              ))}
            </select>

            <div>
              <Link to="/link-account">Link Another Bank</Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>{selectedBank.bankName} Dashboard</h1>
        <button onClick={() => setSelectedBank(null)}>Switch Bank</button>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <hr />

      <section>
        <h2>Account Summary</h2>
        <p>Account Number: ****{selectedBank.accountNumber?.toString().slice(-4)}</p>
        <p>Balance: ₹{selectedBank.balance}</p>
      </section>

      <hr />

      <section>
        <h3>Recent Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {dummyTransactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.date}</td>
                <td>{tx.desc}</td>
                <td>{tx.type}</td>
                <td>
                  {tx.type === 'Credit' ? '+' : '-'}₹{tx.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div>
        <button onClick={() => alert('Fast transfer triggered')}>Transfer Funds</button>
        <button onClick={() => alert('Loading statements')}>Download Statement</button>
      </div>
    </div>
  );
}
