import React, { useState } from 'react';

/**
 * UserAvatar component replicates the avatar logic and style from Navbar.
 * It shows the user's avatar and toggles an account menu on click.
 */
const UserAvatar = ({ user }) => {
  const [accountOpen, setAccountOpen] = useState(false);
  let avatarUrl = null;
  if (user) {
    avatarUrl = user.avatar || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(user.email || user._id || 'random')}`;
  } else {
    avatarUrl = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=random`;
  }

  const toggleAccountMenu = () => setAccountOpen((open) => !open);

  return (
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
              <p className="font-semibold">{user?.name || 'User'}</p>
              <p className="text-sm text-gray-500">{user?.phone || 'No phone'}</p>
            </div>
          </div>
          {/* Add more menu items as needed */}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
