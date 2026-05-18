import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/v1/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      //Jwt
      localStorage.setItem('bank_auth_token', data.token);

      navigate('/home');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center p-6">

      <div className="w-full max-w-6xl bg-white rounded-[32px] overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">

        {/* LEFT SIDE - LOGIN FORM */}
        <div className="bg-[#fafafa] flex items-center justify-center p-10">

          <div className="w-full max-w-md">

            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>

            <p className="text-gray-500 mb-8">
              Sign in to continue managing your money.
            </p>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>

                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] hover:scale-[1.02] transition-all duration-300 text-white py-3 rounded-xl font-semibold"
              >
                Sign In
              </button>
            </form>

            <p className="text-center text-gray-500 mt-8">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#2563eb] hover:underline"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - DESIGN SECTION */}
        <div className="bg-[#0f172a] text-white p-12 flex flex-col justify-between">

          <div>
            <h1
              className="text-5xl font-bold tracking-tight text-[#7dd3fc]"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              Probably<span className="text-white">ABank</span>
            </h1>

            <div className="mt-20">
              <h2 className="text-5xl font-bold leading-tight text-gray-100">
                Welcome
                <br />
                Back.
              </h2>

              <p className="mt-6 text-lg text-gray-300 leading-8">
                Your payments, transfers, and banking tools —
                exactly where you left them.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 mt-10">

            <p className="text-lg leading-8 text-gray-200">
              Securely access your accounts, track transactions,
              and manage your finances in one place.
            </p>

            <div className="mt-6">
              <p className="font-semibold">
                Logging into adulthood since 2026.
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Fast • Secure • Reliable
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}