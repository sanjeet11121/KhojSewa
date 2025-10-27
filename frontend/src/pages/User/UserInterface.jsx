import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const UserInterface = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [lostPosts, setLostPosts] = useState([]);
  const [foundPosts, setFoundPosts] = useState([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* ------------------------- Fetch user and posts ------------------------- */
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const profileRes = await fetch("http://localhost:8000/api/v1/users/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const profileData = await profileRes.json();

        if (profileRes.ok) {
          const userInfo = profileData.data;
          setUser(userInfo);
          setAvatarPreview(
            userInfo.avatar ||
              `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(
                userInfo.email || userInfo._id || "random"
              )}`
          );
        } else {
          throw new Error(profileData.message || "Failed to fetch user");
        }

        // Fetch lost posts
        const lostRes = await fetch("http://localhost:8000/api/v1/users/user-lost-posts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const lostData = await lostRes.json();
        if (lostRes.ok) setLostPosts(lostData.data || []);

        // Fetch found posts
        const foundRes = await fetch("http://localhost:8000/api/v1/users/user-found-posts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const foundData = await foundRes.json();
        if (foundRes.ok) setFoundPosts(foundData.data || []);
      } catch (err) {
        console.error("Error fetching user data:", err);
        alert("Failed to load user data. Please login again.");
        localStorage.removeItem("accessToken");
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  /* ------------------------- Handlers ------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

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

      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8000/api/v1/users/upload-avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, avatar: data.data.avatar }));
        setAvatarPreview(data.data.avatar);
        alert("Avatar updated successfully!");
      } else {
        alert(data.message || "Failed to upload avatar.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading avatar.");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8000/api/v1/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          bio: user.bio,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.data);
        localStorage.setItem("user", JSON.stringify(data.data));
        alert("Profile updated successfully!");
      } else {
        alert(data.message || "Update failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword)
      return alert("Please fill all password fields.");
    if (newPassword !== confirmPassword)
      return alert("New passwords do not match.");

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8000/api/v1/users/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        alert("Password changed successfully!");
      } else {
        alert(data.message || "Password change failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error changing password.");
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8000/api/v1/users/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        alert("Account deleted successfully.");
        navigate("/");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete account.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting account.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
  };

  /* ------------------------- Loading ------------------------- */
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100">
        <div className="text-gray-700 font-medium">
          Loading your account...
        </div>
      </div>
    );
  }

  /* ------------------------- JSX ------------------------- */
  return (
    <>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Account</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteAccount}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 pt-24 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Avatar + Info */}
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
              <h1 className="text-2xl font-bold text-gray-800">
                {user.fullName || "User"}
              </h1>
              <p className="text-sm text-gray-600">
                {user.email || "No email set"}
              </p>
              <button
                onClick={() => navigate("/user/dashboard")}
                className="mt-3 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <h2 className="text-xl font-semibold mb-4 text-indigo-700">
          Account Details
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={user.fullName || ""}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={user.phoneNumber || ""}
              onChange={handleChange}
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            name="bio"
            value={user.bio || ""}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            rows={3}
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="mt-6">
          <button
            onClick={handleUpdateProfile}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Save Changes
          </button>
        </div>

        {/* Password Section */}
        <h2 className="text-xl font-semibold mt-8 mb-4 text-indigo-700">
          Change Password
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleChangePassword}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Change Password
          </button>
        </div>

        {/* Account Deletion Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-red-700">
            Danger Zone
          </h2>
          <p className="text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default UserInterface;
