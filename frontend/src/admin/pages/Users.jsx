import { useState } from "react";
import { FaStar } from "react-icons/fa";

const initialUsers = [
  { id: 1, name: "John Doe", status: "Active", rating: 4 },
  { id: 2, name: "Jane Smith", status: "Blocked", rating: 3 },
  { id: 3, name: "Alice Johnson", status: "Active", rating: 5 },
  { id: 4, name: "Bob Lee", status: "Active", rating: 2 },
  { id: 5, name: "Sara Khan", status: "Blocked", rating: 4 },
  { id: 6, name: "David Miller", status: "Active", rating: 5 },
  { id: 7, name: "Emma Watson", status: "Active", rating: 3 },
];

function StarRating({ rating }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="flex justify-center">
      {stars.map((star) => (
        <FaStar
          key={star}
          className={`mx-0.5 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          aria-label={star <= rating ? "Filled star" : "Empty star"}
        />
      ))}
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const usersPerPage = 5;
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const toggleBlockUser = (id) => {
    setUsers(users.map(user =>
      user.id === id
        ? { ...user, status: user.status === "Blocked" ? "Active" : "Blocked" }
        : user
    ));
  };

  const removeUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">User Management</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search user..."
        className="border p-2 rounded mb-4 w-full sm:w-1/3 text-sm md:text-base"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1); // Reset page on search
        }}
      />

      {/* Table Wrapper for Mobile */}
      <div className="overflow-x-auto bg-white rounded shadow border border-gray-200">
        <table className="w-full text-sm md:text-base">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 md:p-3 text-left">Name</th>
              <th className="p-2 md:p-3 text-left">Status</th>
              <th className="p-2 md:p-3 text-center">Rating</th>
              <th className="p-2 md:p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="p-2 md:p-3">{user.name}</td>
                  <td className="p-2 md:p-3">{user.status}</td>
                  <td className="p-2 md:p-3 text-center">
                    <StarRating rating={user.rating} />
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    <div className="flex justify-center flex-col sm:flex-row gap-2">
                      <button
                        className={`px-3 py-1 rounded text-sm md:text-base
                          ${user.status === "Blocked"
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-yellow-500 text-white hover:bg-yellow-600"}`}
                        onClick={() => toggleBlockUser(user.id)}
                      >
                        {user.status === "Blocked" ? "Unblock" : "Block"}
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm md:text-base"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to remove this user?")) {
                            removeUser(user.id);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-4 flex-wrap text-sm md:text-base">
        <button
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span className="font-semibold">{currentPage} / {totalPages}</span>
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
