import React, { useState } from "react";

const initialPosts = [
  {
    id: 1,
    title: "Lost wallet with inappropriate image",
    reportedBy: "User123",
    date: "2025-07-30",
    reason: "Inappropriate image",
    status: "Pending",
  },
  {
    id: 2,
    title: "Spam post - iPhone giveaway",
    reportedBy: "User456",
    date: "2025-07-28",
    reason: "Spam content",
    status: "Pending",
  },
];

export default function InappropriatePost() {
  const [posts, setPosts] = useState(initialPosts);

  const handleAction = (id, action) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, status: action } : post
      )
    );
  };

  const filteredPosts = posts.filter((post) => post.status !== "Removed");

  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">
        Inappropriate Posts
      </h1>

      {filteredPosts.length === 0 ? (
        <p className="text-gray-600">No inappropriate posts reported.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow border border-gray-200">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 md:p-3 text-left">Title</th>
                <th className="p-2 md:p-3 text-left">Reported By</th>
                <th className="p-2 md:p-3 text-left">Date</th>
                <th className="p-2 md:p-3 text-left">Reason</th>
                <th className="p-2 md:p-3 text-left">Status</th>
                <th className="p-2 md:p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr
                  key={post.id}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2 md:p-3">{post.title}</td>
                  <td className="p-2 md:p-3">{post.reportedBy}</td>
                  <td className="p-2 md:p-3">{post.date}</td>
                  <td className="p-2 md:p-3">{post.reason}</td>
                  <td className="p-2 md:p-3 font-medium">
                    {post.status}
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    <div className="flex justify-center flex-col sm:flex-row gap-2">
                      {post.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleAction(post.id, "Approved")}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm md:text-base"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              window.confirm("Are you sure you want to remove this post?") &&
                              handleAction(post.id, "Removed")
                            }
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm md:text-base"
                          >
                            Remove
                          </button>
                        </>
                      )}
                      {post.status !== "Pending" && (
                        <span className="text-gray-600 italic">{post.status}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
