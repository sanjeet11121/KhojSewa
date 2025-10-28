import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import MyPosts from './MyPosts';
import Messages from './Messages';
import MyDetail from './MyDetails';
// import Footer from '../../components/Footer';
import logo from '../../assets/khojsewa_logo.png';
import UserAvatar from '../../components/UserAvatar';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get initial tab from URL parameter
  const initialTab = searchParams.get('tab') || 'myPosts';
  const [activeSection, setActiveSection] = useState(initialTab);
  const tabs = [
    { key: 'myPosts', label: 'My Posts' },
    { key: 'messages', label: 'Messages' },
    { key: 'myDetails', label: 'My Details' }
  ];
  
  // Handle URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['myPosts', 'messages', 'myDetails'].includes(tab)) {
      setActiveSection(tab);
    }
  }, [searchParams]);
  
  // Get user object for avatar
  const rawUser = localStorage.getItem('user');
  let user = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Custom Top Bar */}
  <div className="w-full flex items-center justify-between px-8 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="Logo"
              className="h-14 w-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
            <span className="text-2xl font-bold text-white cursor-pointer" onClick={() => navigate('/')}>KhojSewa</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold text-lg">Hi, {user?.fullName || user?.name || 'User'}</span>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-purple-700 font-semibold px-4 py-2 rounded-lg shadow hover:bg-purple-100 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
      <main className="flex-grow">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-20 lg:px-32 py-16 pt-12">
          <div className="bg-white px-16 py-16 shadow-lg rounded-xl min-h-[700px] min-h-screen">
            <div className="flex flex-wrap border-b mb-8 gap-4 justify-center">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`px-8 py-3 font-medium text-md focus:outline-none transition-all duration-200 border-b-2 ${activeSection === tab.key ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
                  style={{ background: 'none', borderRadius: '0.5rem' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mt-8">
              {activeSection === 'myPosts' && <MyPosts />}
              {activeSection === 'messages' && <Messages user={user} />}
              {activeSection === 'myDetails' && <MyDetail />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;