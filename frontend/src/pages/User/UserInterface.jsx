import React, { useEffect, useState } from "react";

const UserAccount = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
    }

    // Fetch user's posts (replace with your API endpoint)
    fetch("/api/v1/users/posts", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error fetching posts:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    // Send update to backend
    fetch("/api/v1/users/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify(user),
    })
      .then((res) => res.json())
      .then((data) => alert("Profile updated successfully!"))
      .catch((err) => alert("Update failed."));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-purple-700">Account Settings</h1>
        {user && (
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={user.name || ""}
                onChange={handleChange}
                className="mt-1 w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={user.phone || ""}
                onChange={handleChange}
                className="mt-1 w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                placeholder="New password"
                onChange={handleChange}
                className="mt-1 w-full border p-2 rounded"
              />
            </div>
            <button
              onClick={handleUpdate}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Update Info
            </button>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">My Posts</h2>
        {posts.length === 0 ? (
          <p>No posts found.</p>
        ) : (
          <div className="grid gap-4">
            {posts.map((post, index) => (
              <div key={index} className="p-4 border rounded">
                <h3 className="font-semibold text-lg">{post.itemName}</h3>
                <p className="text-sm text-gray-700">{post.description}</p>
                <p className="text-sm text-gray-500 italic">Posted on {post.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAccount;
