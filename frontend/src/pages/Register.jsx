import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/v1/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, phone_number: phoneNumber, dob }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('bank_auth_token', data.token);
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center px-3 py-4 md:p-6">

      <div className="w-full max-w-6xl bg-white  overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="bg-[#0f172a] text-white p-5 md:p-12 flex flex-col justify-center gap-10 relative">

          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-wide text-[#7dd3fc] " 
            style={{ fontFamily: 'Space Grotesk' }}git >
              
              Probably<span className="text-white">ABank</span>
            </h1>

            <div className="mt-8 md:mt-20 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight text-gray-300">
                Payments.
                <br />
                Banking.
                <br />
                Everything.
              </h2>

              <p className="mt-6 text-gray-300 text-base md:text-lg">
                If it involves money, we do it.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/10 mt-10">
            <p className="text-base md:text-lg leading-7 md:leading-8 text-gray-200">
              Manage payments, transfers, UPI services, and banking
              operations all from one secure platform.
            </p>

            <div className="mt-6">
              <p className="font-semibold">From UPI to bank accounts — we handle the chaos.</p>
              <p className="text-sm text-gray-400 mt-1">
                Fast • Secure • Reliable
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-[#fafafa] flex items-center justify-center p-5 md:p-10">

          <div className="w-full max-w-md">

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>

            <p className="text-gray-500 mb-8">
              Start your financial journey with us.
            </p>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">

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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>

                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>

                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full max-w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-semibold transition duration-300"
              >
                Create Account
              </button>
            </form>

            <p className="text-center text-gray-500 mt-8">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-black hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}