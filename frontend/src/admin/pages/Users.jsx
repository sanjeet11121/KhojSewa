import { useState } from "react";
import { FaStar } from "react-icons/fa";

// Initial users with rating
const initialUsers = [
  { id: 1, name: "John Doe", status: "Active", rating: 4 },
  { id: 2, name: "Jane Smith", status: "Blocked", rating: 3 },
  { id: 3, name: "Alice Johnson", status: "Active", rating: 5 },
];

// Star Rating Component
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
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");

  const blockUser = (id) => {
    setUsers(users.map(user => user.id === id ? { ...user, status: "Blocked" } : user));
  };

  const removeUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">User Management</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search user..."
        className="border p-2 mb-4 w-full md:w-1/3 rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left w-1/4">Name</th>
              <th className="p-3 text-left w-1/4">Status</th>
              <th className="p-3 text-center w-1/4">Rating</th>
              <th className="p-3 text-center w-1/4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.status}</td>
                <td className="p-3 text-center">
                  <StarRating rating={user.rating} />
                </td>
                <td className="p-3 text-center space-x-2">
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    onClick={() => blockUser(user.id)}
                  >
                    Block
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => removeUser(user.id)}
                  >
                    Terminate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
