import React, { useState } from 'react';
import ClipLoader from "react-spinners/ClipLoader";
import logo from '../assets/khojsewa_logo.png';
import signinImg from '../assets/signin.png';
import { Link, useNavigate } from "react-router-dom";
import { api } from '../config.js';

function SignUp() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [color] = useState("linear-gradient(to right, #8a2be2, #9400d3)");
  const navigate = useNavigate();

  const override = {
    display: "block",
    margin: "0 auto",
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${api}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.name,
          email: form.email,
          phoneNumber: form.mobile,
          password: form.password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to send OTP');
      } else {
        setSuccess('OTP sent! Please check your email for verification.');
        setUserEmail(form.email);
        setShowOtpForm(true);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setOtpLoading(true);

    try {
      const res = await fetch(`${api}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          otp: otp
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'OTP verification failed');
      } else {
        setSuccess('Signup successful! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/signin');
        }, 1500);
        setShowOtpForm(false);
        setForm({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
        setOtp('');
      }
    } catch (err) {
      setError('Network error');
    }
    setOtpLoading(false);
  };

  const handleResendOtp = async () => {
    setError('');
    setOtpLoading(true);

    try {
      const res = await fetch(`${api}/api/v1/auth/resend-verification-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to resend OTP');
      } else {
        setSuccess('New OTP sent to your email!');
      }
    } catch (err) {
      setError('Network error');
    }
    setOtpLoading(false);
  };

  // OTP Verification Form
  if (showOtpForm) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-purple-200 to-purple-100 flex justify-center items-center">
        <div className="w-[90%] lg:max-w-[40%] h-[500px] bg-white rounded-2xl flex flex-col items-center justify-center p-8 border-2 border-purple-300">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Logo" className="w-20 h-20 rounded-full mb-4" />
            <h2 className="text-2xl font-bold text-purple-800">Verify Your Email</h2>
            <p className="text-gray-600 text-center mt-2">
              We've sent a 6-digit OTP to <strong>{userEmail}</strong>
            </p>
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-4">{success}</div>}

          <form onSubmit={handleOtpSubmit} className="w-full max-w-xs">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={handleOtpChange}
                className="w-full p-3 border border-gray-300 rounded-xl text-center text-lg font-mono tracking-widest"
                maxLength={6}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition mb-4 flex items-center justify-center"
              disabled={otpLoading}
            >
              {otpLoading ? (
                <ClipLoader
                  color={color}
                  loading={otpLoading}
                  cssOverride={override}
                  size={24}
                  aria-label="Loading Spinner"
                />
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={handleResendOtp}
              className="text-purple-600 hover:text-purple-700 text-sm underline"
              disabled={otpLoading}
            >
              Didn't receive OTP? Resend
            </button>
          </div>

          <div className="text-sm mt-6 text-center">
            <Link to="/signin" className="text-purple-600 underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-b from-purple-200 to-purple-100 flex justify-center items-center">
      <div className="w-[90%] lg:max-w-[60%] h-[650px] bg-white rounded-2xl flex overflow-hidden border-2 border-purple-300">

        {/* Left Panel */}
        <div className="hidden lg:flex w-[50%] h-full flex-col items-center p-6 gap-4 justify-center bg-purple-50">
          <span className="text-xl font-semibold text-purple-700">Sign up to</span>
          <Link to="/">
            <img src={logo} alt="Logo" className="w-28 h-28 rounded-full hover:scale-105 transition" />
          </Link>
          <p className="text-center text-base text-gray-700">
            Join <span className="font-bold text-purple-600">KhojSewa</span><br />
            Reuniting lost items with their owners.
          </p>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-[50%] h-full flex flex-col justify-center items-center bg-white px-6 gap-4">
          <div className="flex flex-col items-center">
            <img src={signinImg} alt="Sign Up" className="w-24 h-24 rounded-full" />
            <span className="text-purple-800 text-lg mt-2 font-medium">Create an Account</span>
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
            <input
              type="tel"
              name="mobile"
              placeholder="Mobile Number"
              className="p-3 border border-gray-300 rounded-xl"
              value={form.mobile}
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
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              className="p-3 border border-gray-300 rounded-xl"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition flex items-center justify-center"
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
            <Link to="/signin" className="text-purple-600 underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
