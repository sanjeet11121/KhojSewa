import { Bars3Icon, XMarkIcon, BellIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const navigate = useNavigate();
  const toggleMenu = () => setOpen(!open);
  const toggleAccountMenu = () => setAccountOpen(!accountOpen);

  // Initialize user state
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsSignedIn(!!token);
    if (token) {
      setUser(safeParseUser());
    }
  }, []);

  // Listen for localStorage changes (for avatar updates)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === null) {
        const token = localStorage.getItem('accessToken');
        setIsSignedIn(!!token);
        if (token) {
          setUser(safeParseUser());
        } else {
          setUser(null);
        }
      }
    };

    // Listen to storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    const handleCustomUserUpdate = () => {
      const token = localStorage.getItem('accessToken');
      setIsSignedIn(!!token);
      if (token) {
        setUser(safeParseUser());
      }
    };

    window.addEventListener('userUpdated', handleCustomUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleCustomUserUpdate);
    };
  }, []);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('notifications');
        const list = raw ? JSON.parse(raw) : [];
        setNotifications(Array.isArray(list) ? list : []);
      } catch {
        setNotifications([]);
      }
    };

    // Load immediately when signed in
    if (isSignedIn) load();

    const onUpdate = () => load();
    const onStorage = (e) => {
      if (!e || e.key === 'notifications' || e.key === null) load();
    };

    window.addEventListener('notificationsUpdated', onUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('notificationsUpdated', onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [isSignedIn]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    setIsSignedIn(false);
    setUser(null);
    // Force page reload to clear all state
    window.location.href = '/';
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
          <Link to="/" className="flex items-center space-x-0 text-xl font-bold text-white hover:text-indigo-200 transition-colors duration-200">
            <img src={logo} alt="Logo" className="h-14 w-auto" />
            <span className="hidden sm:inline">KhojSewa</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Home</Link>
            {isSignedIn && <Link to="/user/dashboard" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Dashboard</Link>}
            <Link to="/about" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">About Us</Link>
            {!isSignedIn && <Link to="/signup" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Sign Up</Link>}
            {!isSignedIn && <Link to="/signin" className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">Sign In</Link>}

            {isSignedIn && (
              <div className="relative flex items-center space-x-3">
                <Link to="/user/messages" className="text-white hover:text-indigo-200 relative" title="Messages">
                  <ChatBubbleLeftIcon className="h-6 w-6" />
                </Link>

                <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="text-white hover:text-indigo-200">
                    <BellIcon className="h-6 w-6" />
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-white text-gray-800 shadow-lg rounded-lg z-50 max-h-64 overflow-auto">
                      <div className="p-4 font-semibold border-b">Notifications</div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">No notifications</div>
                      ) : (
                        notifications.map((note, index) => (
                          <div key={index} className="px-4 py-2 hover:bg-gray-100 text-sm border-b">
                            {note.message}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

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
                          <p className="font-semibold">{user?.fullName || user?.name || "User"}</p>
                          <p className="text-sm text-gray-500">{user?.phoneNumber || user?.phone || "No phone"}</p>
                        </div>
                      </div>
                      <button onClick={() => navigate('/User/UserInterface')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded">Manage Account</button>
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded mt-1">Sign Out</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={toggleMenu} className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-indigo-200 focus:outline-none transition-colors duration-200">
              {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-indigo-700 px-2 pt-2 pb-3 space-y-1">
          <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Home</Link>
          {isSignedIn && <Link to="/user/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Dashboard</Link>}
          <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">About Us</Link>
          {!isSignedIn && <Link to="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Sign Up</Link>}
          {!isSignedIn && <Link to="/signin" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200">Sign In</Link>}

          {isSignedIn && (
            <div className="mt-2 space-y-2">
              <Link to="/user/messages" className="w-full flex items-center text-white px-3 py-2 rounded-md hover:bg-indigo-600">
                <ChatBubbleLeftIcon className="h-5 w-5 mr-2" /> Messages
              </Link>
              <button onClick={() => setShowNotifications(!showNotifications)} className="w-full flex items-center text-white px-3 py-2 rounded-md hover:bg-indigo-600">
                <BellIcon className="h-5 w-5 mr-2" /> Notifications
              </button>
              {showNotifications && (
                <div className="bg-white text-gray-800 shadow-lg rounded-lg z-50 max-h-64 overflow-auto">
                  <div className="p-4 font-semibold border-b">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((note, index) => (
                      <div key={index} className="px-4 py-2 hover:bg-gray-100 text-sm border-b">
                        {note.message}
                      </div>
                    ))
                  )}
                </div>
              )}
              <div className="bg-white p-4 rounded-lg text-gray-700">
                <div className="flex items-center space-x-4 mb-4">
                  <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full border" />
                  <div>
                    <p className="font-semibold">{user?.fullName || user?.name || "User"}</p>
                    <p className="text-sm text-gray-500">{user?.phoneNumber || user?.phone || "No phone"}</p>
                  </div>
                </div>
                <button onClick={() => navigate('/User/UserInterface')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded">Manage Account</button>
                <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded mt-1">Sign Out</button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
