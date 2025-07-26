import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/khojsewa_logo.png";

function safeParseUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const toggleMenu = () => setOpen(!open);
  const isSignedIn = !!localStorage.getItem('accessToken');
  const user = isSignedIn ? safeParseUser() : null;
  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    navigate('/');
  };
  // Avatar logic
  let avatarUrl = null;
  if (user) {
    avatarUrl = user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email || user._id || 'random')}`;
  } else if (isSignedIn) {
    avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=random`;
  }
  // Debug log
  if (isSignedIn) console.log('Navbar user:', user);
  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Brand wrapped together */}
          <a
            href="/"
            className="flex items-center space-x-0 text-xl font-bold text-white hover:text-indigo-200 transition-colors duration-200"
          >
            <img src={logo} alt="Logo" className="h-14 w-auto" />
            <span className="hidden sm:inline">KhojSewa</span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Home</a>
            {!isSignedIn && <a href="/signup" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Sign Up</a>}
            {!isSignedIn && <a href="/signin" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Sign In</a>}
            {isSignedIn && <button onClick={handleSignOut} className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer">Sign Out</button>}
            <a href="/about" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">About Us</a>
            {isSignedIn && avatarUrl && (
              <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full border-2 border-white ml-4" />
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-indigo-200 focus:outline-none transition-colors duration-200"
            >
              {open ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-indigo-700 px-2 pt-2 pb-3 space-y-1">
          <a href="/" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Home</a>
          {!isSignedIn && <a href="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Sign Up</a>}
          {!isSignedIn && <a href="/signin" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Sign In</a>}
          {isSignedIn && <button onClick={handleSignOut} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200 bg-transparent border-none cursor-pointer w-full text-left">Sign Out</button>}
          <a href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">About Us</a>
          {isSignedIn && avatarUrl && (
            <div className="flex justify-center mt-2">
              <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full border-2 border-white" />
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
