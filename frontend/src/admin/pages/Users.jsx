// FILE: src/pages/admin/Users.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAdminStore } from "../../store/store";

export default function Users() {
  // ✅ Only extract needed store values, stable reference
  const users = useAdminStore((s) => s.users);
  const usersMeta = useAdminStore((s) => s.usersMeta);
  const loading = useAdminStore((s) => s.loading);
  const fetchAllUsers = useAdminStore((s) => s.fetchAllUsers);
  const toggleUserStatus = useAdminStore((s) => s.toggleUserStatus);
  const deleteUser = useAdminStore((s) => s.deleteUser);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(usersMeta.page || 1);

  // Fetch users on mount and whenever currentPage changes
  useEffect(() => {
    fetchAllUsers(currentPage, 10);
  }, [currentPage]);

  // Update local currentPage if store page changes (pagination)
  useEffect(() => {
    setCurrentPage(usersMeta.page || 1);
  }, [usersMeta.page]);

  const handleToggleStatus = async (user) => {
    await toggleUserStatus(user._id, !user.isActive);
    fetchAllUsers(currentPage, 10); // refresh page
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    const ok = await deleteUser(userId);
    if (!ok) alert("Failed to remove user.");
  };

  // Memoize filtered users to avoid recalculating every render
  const filteredUsers = useMemo(() => {
    return (users || []).filter((user) =>
      (user.fullName || user.username || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

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
                <th className="p-2 md:p-3 text-center">Posts</th>
                <th className="p-2 md:p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">{user.fullName || user.username}</td>
                    <td className="p-3">{user.isActive ? "Active" : "Blocked"}</td>
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
