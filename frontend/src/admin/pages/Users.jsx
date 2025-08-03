import React, { useState } from "react";
import { users as initialUsers } from "../../data/userData";
import { posts } from "../../data/post"; 
import CardComponent from "../components/cardComponent";
import { FaStar } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

function StarRating({ rating }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="flex justify-center">
      {stars.map((star) => (
        <FaStar
          key={star}
          className={`mx-0.5 ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Calculate posts count for each user dynamically
  const usersWithPostCount = users.map(user => {
    const userPostCount = posts.filter(post => post.userId === user.id).length;
    return {...user, posts: userPostCount};
  });

  const usersPerPage = 8;
  const filteredUsers = usersWithPostCount.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const toggleBlockUser = (id) => {
    setUsers(
      users.map((user) =>
        user.id === id
          ? { ...user, status: user.status === "Blocked" ? "Active" : "Blocked" }
          : user
      )
    );
  };

  const removeUser = (id) => {
    setUsers(users.filter((user) => user.id !== id));
    if (selectedUserId === id) setSelectedUserId(null);
  };

  const handleUserClick = (id) => {
    setSelectedUserId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">User Management</h1>

      <input
        type="text"
        placeholder="Search user..."
        className="border p-2 rounded mb-4 w-full sm:w-1/3"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />

      <div className="overflow-x-auto bg-white rounded shadow border border-gray-200">
        <table className="w-full text-sm md:text-base">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 md:p-3 text-left">Name</th>
              <th className="p-2 md:p-3 text-left">Status</th>
              <th className="p-2 md:p-3 text-center">Rating</th>
              <th className="p-2 md:p-3 text-center">Posts</th> {/* Added posts column */}
              <th className="p-2 md:p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <tr
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.status}</td>
                    <td className="p-3 text-center">
                      <StarRating rating={user.rating} />
                    </td>
                    <td className="p-3 text-center font-semibold">{user.posts}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className={`px-3 py-1 rounded text-sm ${
                            user.status === "Blocked"
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-yellow-500 text-white hover:bg-yellow-600"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBlockUser(user.id);
                          }}
                        >
                          {user.status === "Blocked" ? "Unblock" : "Block"}
                        </button>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "Are you sure you want to remove this user?"
                              )
                            ) {
                              removeUser(user.id);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>

                  <AnimatePresence>
                    {selectedUserId === user.id && (
                      <tr>
                        <td colSpan="5" className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                            style={{
                              width: "100%",
                              border: "1px solid rgba(0, 0, 0, 0.1)",
                              borderRadius: "8px",
                              padding: "10px",
                              margin: "8px 0",
                              backgroundColor: "white",
                              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                            }}
                          >
                            <CardComponent
                              profilePicture={user.profilePicture}
                              username={user.name}
                              email={user.email}
                              phone={user.phone}
                              posts={user.posts}
                              status={user.status === "Blocked" ? "Offline" : "Online"}
                            />
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

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
