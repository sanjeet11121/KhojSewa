import React, { useState } from 'react';
import ClipLoader from "react-spinners/ClipLoader";
import logo from '../assets/khojsewa_logo.png';
import signinImg from '../assets/signin.png';

function SignUp() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [color] = useState("#fff");

  const override = {
    display: "block",
    margin: "0 auto",
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Sign up failed');
      } else {
        setSuccess('Sign up successful! You can now sign in.');
        setForm({ name: '', email: '', password: '' });
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-sky-100 to-blue-100 flex justify-center items-center">
      <div className="w-[90%] lg:max-w-[60%] h-[600px] bg-white rounded-2xl flex overflow-hidden border-2 border-sky-300">

        {/* Left Panel */}
        <div className="hidden lg:flex w-[50%] h-full flex-col items-center p-6 gap-4 justify-center bg-sky-50">
          <span className="text-xl font-semibold text-sky-700">Sign up to</span>
          <img src={logo} alt="Logo" className="w-28 h-28 rounded-full" />
          <p className="text-center text-base text-gray-700">
            Join <span className="font-bold text-sky-600">KhojSewa</span><br />
            Reuniting lost items with their owners.
          </p>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-[50%] h-full flex flex-col justify-center items-center bg-white px-6 gap-4">
          <div className="flex flex-col items-center">
            <img src={signinImg} alt="Sign Up" className="w-24 h-24 rounded-full" />
            <span className="text-sky-800 text-lg mt-2 font-medium">Create an Account</span>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}

          <form className="flex flex-col gap-4 w-full max-w-xs" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="p-3 border border-gray-300 rounded-xl"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="p-3 border border-gray-300 rounded-xl"
              value={form.email}
              onChange={handleChange}
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="p-3 border border-gray-300 rounded-xl w-full pr-12"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white p-3 rounded-xl transition flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <ClipLoader
                  color={color}
                  loading={loading}
                  cssOverride={override}
                  size={24}
                  aria-label="Loading Spinner"
                />
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="text-sm mt-2">
            Already have an account?{" "}
            <a href="/signin" className="text-sky-600 underline">
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
