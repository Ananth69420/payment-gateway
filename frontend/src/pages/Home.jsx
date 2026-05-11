import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('bank_auth_token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('bank_auth_token');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <div>
      <header>
        <h1>Welcome to Payment Gateway</h1>
        <button onClick={handleLogout}>Log Out</button>
      </header>

      <nav>
        <div>
          <h3>
            <Link to="/dashboard">Accounts & Balances</Link>
          </h3>
          <p>Link your bank accounts and view balances.</p>
        </div>

        <div>
          <h3>
            <Link to="/upi">UPI & Transfers</Link>
          </h3>
          <p>Send money instantly.</p>
        </div>
      </nav>
    </div>
  );
}
