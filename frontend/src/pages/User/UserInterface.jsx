import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const UserInterface = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // User & UI state
  const [user, setUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [posts, setPosts] = useState([]);

  // Password-related state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ------------------------- Effects ------------------------- */

  // Load user info and posts on mount
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
      setAvatarPreview(
        parsedUser.avatar ||
          `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(
            parsedUser.email || parsedUser._id || "random"
          )}`
      );
    }

    // Fetch user posts
    fetch("/api/v1/users/posts", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setPosts(data || []))
      .catch((err) => console.error("Error fetching posts:", err));
  }, []);

  /* ------------------------- Handlers ------------------------- */

  // Input changes for account info
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  // Avatar selection
  const handleAvatarClick = () => fileInputRef.current.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/v1/users/upload-avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Avatar updated successfully!");
        setUser((prev) => ({ ...prev, avatar: data.avatarUrl }));
        localStorage.setItem("user", JSON.stringify({ ...user, avatar: data.avatarUrl }));
      } else {
        alert(data.message || "Failed to upload avatar.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading avatar.");
    }
  };

  // Update profile (info + password)
  const handleUpdate = async () => {
    if (!user) return;

    // Password validation
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) return alert("Please enter your current password first.");
      if (newPassword !== confirmPassword) return alert("New passwords do not match.");
    }

    try {
      const res = await fetch("/api/v1/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          ...user,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully!");
        localStorage.setItem("user", JSON.stringify(user));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(data.message || "Update failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/v1/users/delete-account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (res.ok) {
        alert("Account deleted successfully.");
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        navigate("/");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete account.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting account.");
    }
  };

  /* ------------------------- Loading State ------------------------- */

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100">
        <div className="text-gray-700 font-medium">Loading your account...</div>
      </div>
    );
  }

  /* ------------------------- JSX ------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 pt-24 p-6">
      {/* Profile Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={avatarPreview}
                alt="User Avatar"
                className="h-24 w-24 rounded-full object-cover border-4 border-indigo-500 cursor-pointer hover:opacity-90 transition"
                onClick={handleAvatarClick}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div
                className="absolute bottom-0 right-0 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full cursor-pointer"
                onClick={handleAvatarClick}
              >
                Change
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{user.name || "User"}</h1>
              <p className="text-sm text-gray-600">{user.email || "No email set"}</p>
              <button
                onClick={() => navigate("/user/dashboard")}
                className="mt-3 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Account Info Form */}
        <h2 className="text-xl font-semibold mb-4 text-indigo-700">Account Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="name"
              value={user.name || ""}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={user.phone || ""}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={user.bio || ""}
              onChange={handleChange}
              rows="3"
              placeholder="Tell us a little about yourself..."
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            ></textarea>
          </div>
        </div>

        {/* Password Section */}
        <h2 className="text-xl font-semibold mt-8 mb-4 text-indigo-700">Change Password</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleUpdate}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Save Changes
          </button>
        </div>

        {/* Delete Account Section */}
        <div className="mt-10 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
          <p className="text-gray-600 mb-4">
            Once you delete your account, all your posts and data will be permanently removed.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-4xl mx-auto mt-10 bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700">My Posts</h2>
        {posts.length === 0 ? (
          <p className="text-gray-600">No posts found.</p>
        ) : (
          <div className="grid gap-4">
            {posts.map((post, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:shadow transition"
              >
                <h3 className="font-semibold text-lg text-gray-800">{post.itemName}</h3>
                <p className="text-sm text-gray-600">{post.description}</p>
                <p className="text-xs text-gray-500 italic mt-1">
                  Posted on {new Date(post.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInterface;
