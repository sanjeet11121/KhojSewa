// FILE: src/pages/admin/Users.jsx
import React, { useEffect, useState } from "react";
import { useAdminStore } from "../../store/store";
import CardComponent from "../components/cardComponent";
import { FaStar } from "react-icons/fa";

/*
  Users page:
  - Uses the admin store for users and actions
  - Provides searching and pagination
*/

function StarRating({ rating }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="flex justify-center">
      {stars.map((star) => (
        <FaStar
          key={star}
          className={`mx-0.5 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function Users() {
  const {
    users,
    usersMeta,
    loading,
    fetchAllUsers,
    toggleUserStatus,
    deleteUser,
  } = useAdminStore((s) => ({
    users: s.users,
    usersMeta: s.usersMeta,
    loading: s.loading,
    fetchAllUsers: s.fetchAllUsers,
    toggleUserStatus: s.toggleUserStatus,
    deleteUser: s.deleteUser,
  }));

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(usersMeta.page || 1);

  useEffect(() => {
    fetchAllUsers(currentPage, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(usersMeta.page || 1);
  }, [usersMeta.page]);

  const handleToggleStatus = async (user) => {
    await toggleUserStatus(user._id, !user.isActive);
    // refresh current page data
    fetchAllUsers(currentPage, 10);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    const ok = await deleteUser(userId);
    if (ok) {
      // If deleteUser already updated local state, nothing more to do.
    } else {
      alert("Failed to remove user.");
    }
  };

  const filteredUsers = (users || []).filter((user) =>
    (user.fullName || user.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = usersMeta.totalPages || 1;

  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">User Management</h1>
      <input
        type="text"
        placeholder="Search user..."
        className="border p-2 rounded mb-4 w-full sm:w-1/3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow border border-gray-200">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 md:p-3 text-left">Name</th>
                <th className="p-2 md:p-3 text-left">Status</th>
                <th className="p-2 md:p-3 text-center">Rating</th>
                <th className="p-2 md:p-3 text-center">Posts</th>
                <th className="p-2 md:p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-4 text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <td className="p-3">{user.fullName || user.username}</td>
                    <td className="p-3">{user.isActive ? "Active" : "Blocked"}</td>
                    <td className="p-3 text-center">
                      <StarRating rating={user.rating || 0} />
                    </td>
                    <td className="p-3 text-center font-semibold">{user.posts?.length || 0}</td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      <button
                        className={`px-3 py-1 rounded text-sm ${
                          user.isActive
                            ? "bg-yellow-500 text-white hover:bg-yellow-600"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                        onClick={() => handleToggleStatus(user)}
                        disabled={loading}
                      >
                        {user.isActive ? "Block" : "Unblock"}
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center items-center gap-3 mt-4 flex-wrap text-sm md:text-base">
        <button
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span className="font-semibold">
          {currentPage} / {totalPages}
        </span>
        <button
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
