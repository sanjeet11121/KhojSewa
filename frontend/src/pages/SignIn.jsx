import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClipLoader from "react-spinners/ClipLoader";
import logo from "../assets/khojsewa_logo.png";
import signinImg from "../assets/signin.png";
import { Link } from "react-router-dom";

function SignIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const res = await fetch('http://localhost:8000/api/v1/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Sign in failed');
      } else {
        setSuccess('Sign in successful!');
        localStorage.setItem('user', JSON.stringify(data.data?.user));
        localStorage.setItem('accessToken', data.data?.accessToken);
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-100 to-white flex justify-center items-center">
      <div className="w-[90%] lg:max-w-[60%] h-[600px] bg-white rounded-2xl flex overflow-hidden border-2 border-purple-300 shadow-md">

        {/* Left Side Logo/Intro */}
        <div className="hidden lg:flex w-[50%] h-full flex-col items-center p-6 gap-4 justify-center bg-purple-50">
          <span className="text-xl font-semibold text-purple-700">
            Sign in to
          </span>
          <Link to="/">
  <img src={logo} alt="Logo" className="w-28 h-28 rounded-full hover:scale-105 transition" />
</Link>
          <p className="text-center text-base text-gray-700">
            Welcome to <span className="font-bold text-purple-600">KhojSewa</span><br />
            Reuniting lost items with their owners.
          </p>
        </div>

        {/* Right Side Form */}
        <div className="w-full lg:w-[50%] h-full flex flex-col justify-center items-center px-6 gap-4 bg-white">
          <div className="flex flex-col items-center">
            <img src={signinImg} alt="Sign In" className="w-24 h-24 rounded-full" />
            <span className="text-purple-800 text-lg mt-2 font-medium">Welcome Back</span>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}

          <form className="flex flex-col gap-4 w-full max-w-xs" onSubmit={handleSubmit}>
            <input
              type="text"
              name="email"
              placeholder="Enter your email e.g. johndoe@example.com"
              className="p-3 border border-gray-300 rounded-xl focus:outline-purple-400"
              value={form.email}
              onChange={handleChange}
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password (min. 6 characters)"
                className="p-3 border border-gray-300 rounded-xl w-full pr-12 focus:outline-purple-400"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 focus:outline-none"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white p-3 rounded-xl transition flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <ClipLoader
                  color="#ffffff"
                  loading={loading}
                  size={24}
                />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="text-sm mt-2">
            Don't have an account?{" "}
            <a href="/signup" className="text-purple-600 underline">
              Sign Up
            </a>
          </div>
          <div
            className="text-sm mt-1 text-purple-700 cursor-pointer"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
