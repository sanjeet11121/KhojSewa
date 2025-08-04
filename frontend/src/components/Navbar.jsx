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
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const toggleMenu = () => setOpen(!open);
  const toggleAccountMenu = () => setAccountOpen(!accountOpen);
  const isSignedIn = !!localStorage.getItem('accessToken');
  const user = isSignedIn ? safeParseUser() : null;

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    navigate('/');
  };

  let avatarUrl = null;
  if (user) {
    avatarUrl = user.avatar || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(user.email || user._id || 'random')}`;
  } else if (isSignedIn) {
    avatarUrl = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=random`;
  }

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <a href="/" className="flex items-center space-x-0 text-xl font-bold text-white hover:text-indigo-200 transition-colors duration-200">
            <img src={logo} alt="Logo" className="h-14 w-auto" />
            <span className="hidden sm:inline">KhojSewa</span>
          </a>

          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Home</a>
            {!isSignedIn && <a href="/signup" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Sign Up</a>}
            {!isSignedIn && <a href="/signin" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Sign In</a>}
            <a href="/about" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">About Us</a>
            {isSignedIn && avatarUrl && (
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="avatar"
                  onClick={toggleAccountMenu}
                  className="h-10 w-10 rounded-full border-2 border-white cursor-pointer"
                />
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white shadow-lg rounded-lg z-50 p-4 text-gray-700">
                    <div className="flex items-center space-x-4 mb-4">
                      <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full border" />
                      <div>
                        <p className="font-semibold">{user?.name || "User"}</p>
                        <p className="text-sm text-gray-500">{user?.phone || "No phone"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/User/UserInterface')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      Manage Account
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded mt-1"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

      {open && (
        <div className="md:hidden bg-indigo-700 px-2 pt-2 pb-3 space-y-1">
          <a href="/" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Home</a>
          {!isSignedIn && <a href="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Sign Up</a>}
          {!isSignedIn && <a href="/signin" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Sign In</a>}
          <a href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">About Us</a>
          {isSignedIn && avatarUrl && (
            <div className="flex justify-center mt-2">
              <img
                src={avatarUrl}
                alt="avatar"
                onClick={toggleAccountMenu}
                className="h-10 w-10 rounded-full border-2 border-white cursor-pointer"
              />
              {accountOpen && (
                <div className="absolute right-4 mt-2 w-60 bg-white shadow-lg rounded-lg z-50 p-4 text-gray-700">
                  <div className="flex items-center space-x-4 mb-4">
                    <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full border" />
                    <div>
                      <p className="font-semibold">{user?.name || "User"}</p>
                      <p className="text-sm text-gray-500">{user?.phone || "No phone"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/User/UserInterface')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    Manage Account
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded mt-1"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
