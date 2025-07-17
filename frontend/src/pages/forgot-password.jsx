import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import logo from "../assets/khojsewa_logo.png";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [color] = useState("#fff");

  const override = {
    display: "block",
    margin: "0 auto",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/sendOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to send OTP');
      } else {
        setStep(2);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/verifyOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid OTP');
      } else {
        setStep(3);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Password reset failed');
      } else {
        setStep(4);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-sky-100 to-blue-100 flex justify-center items-center">
      <div className="w-[90%] max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-sky-300">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="w-20 h-20 rounded-full" />
          <h2 className="text-2xl font-bold text-sky-700 mt-4">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
            {step === 4 && "Success!"}
          </h2>
          <p className="text-gray-600 text-sm text-center">
            {step === 1 && "Enter your email to receive a verification code."}
            {step === 2 && `An OTP was sent to ${email}`}
            {step === 3 && "Enter your new password below."}
            {step === 4 && "Password reset successfully! You can now sign in."}
          </p>
        </div>

        {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
        {passwordError && <div className="text-red-500 text-sm mb-4 text-center">{passwordError}</div>}

        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-sky-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl flex justify-center items-center transition"
              disabled={loading}
            >
              {loading ? (
                <ClipLoader color={color} loading={loading} cssOverride={override} size={20} />
              ) : (
                "Send OTP"
              )}
            </button>
            <a href="/signin" className="text-sky-600 text-sm text-center block mt-2 underline">
              Back to Sign In
            </a>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <input
              type="text"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-sky-500 tracking-widest text-center text-lg"
              required
            />
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl flex justify-center items-center transition"
              disabled={loading}
            >
              {loading ? (
                <ClipLoader color={color} loading={loading} cssOverride={override} size={20} />
              ) : (
                "Verify & Continue"
              )}
            </button>
            <div className="text-center text-sm text-gray-500">
              Didn't get it?{" "}
              <button type="button" onClick={handleSubmit} className="text-sky-600 underline font-medium">
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-sky-500"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-sky-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl flex justify-center items-center transition"
              disabled={loading}
            >
              {loading ? (
                <ClipLoader color={color} loading={loading} cssOverride={override} size={20} />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700">Your password was updated successfully.</p>
            <a
              href="/signin"
              className="block w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Go to Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
