import { useNavigate, Link } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('bank_auth_token');

  const handleLogout = () => {
    localStorage.removeItem('bank_auth_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-6 py-8 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-16">
        <h1
          className="text-4xl font-bold tracking-tight text-[#2563eb]"
          style={{ fontFamily: 'Space Grotesk' }}
        >
          Probably<span className="text-black">ABank</span>
        </h1>

        {token ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white hover:bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl font-semibold border border-gray-200 transition duration-300"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-300"
            >
              Log Out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-300"
          >
            Sign In
          </Link>
        )}
      </div>

      <div className="max-w-7xl mx-auto mb-14">
        <h2 className="text-6xl font-bold text-gray-900 leading-tight">
          Everything money.
          <br />
          One dashboard.
        </h2>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-8">
          Manage bank accounts, make UPI transfers, track balances,
          and handle payments, all from one place.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link to="/dashboard">
          <div className="bg-[#0f172a] text-white rounded-[28px] p-10 h-[320px] flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 shadow-xl cursor-pointer">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
                Core Banking
              </p>

              <h3 className="text-4xl font-bold mt-4">
                Dashboard & Accounts
              </h3>

              <p className="mt-6 text-gray-300 leading-8 text-lg">
                View your active card, check current balances,
                and link multiple retail bank partners seamlessly.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[#7dd3fc] font-semibold">
                Open Dashboard
              </p>

              <div className="bg-white/10 px-4 py-2 rounded-xl text-sm">
                Secure Banking
              </div>
            </div>
          </div>
        </Link>

        <Link to="/upi">
          <div className="bg-white rounded-[28px] p-10 h-[320px] flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 shadow-xl border border-gray-200 cursor-pointer">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                Payments
              </p>

              <h3 className="text-4xl font-bold mt-4 text-gray-900">
                UPI & Transfers
              </h3>

              <p className="mt-6 text-gray-600 leading-8 text-lg">
                Send money instantly, manage UPI IDs,
                and transfer funds without the drama.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[#2563eb] font-semibold">
                Start Transfer
              </p>

              <div className="bg-gray-100 px-4 py-2 rounded-xl text-sm text-gray-700">
                Instant Payments
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}