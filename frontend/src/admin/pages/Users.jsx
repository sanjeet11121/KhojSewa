import React, { useEffect, useState } from "react";
import CardComponent from "../components/cardComponent";
import { getAllUsers, toggleUserStatus, deleteUserById } from "../services/adminApi";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar } from "react-icons/fa";

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
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (page) => {
    setLoading(true);
    try {
      const data = await getAllUsers(page);
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleToggleStatus = async (user) => {
    try {
      const updatedUser = await toggleUserStatus(user._id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser.data._id ? updatedUser.data : u))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    try {
      await deleteUserById(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((user) =>
    (user.fullName || user.username).toLowerCase().includes(search.toLowerCase())
  );

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
                  <React.Fragment key={user._id}>
                    <tr className="cursor-pointer hover:bg-gray-50 transition-colors">
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
                        >
                          {user.isActive ? "Block" : "Unblock"}
                        </button>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
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
