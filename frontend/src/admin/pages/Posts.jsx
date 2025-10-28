// FILE: src/pages/admin/Posts.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAdminStore } from "../../store/store";

const POSTS_PER_PAGE = 8;

export default function Posts() {
  // ✅ Stable zustand selectors
  const posts = useAdminStore((s) => s.posts);
  const postsMeta = useAdminStore((s) => s.postsMeta);
  const postsLoading = useAdminStore((s) => s.postsLoading);
  const fetchPosts = useAdminStore((s) => s.fetchPosts);
  const updatePostStatus = useAdminStore((s) => s.updatePostStatus);

  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Fetch posts on mount and when page changes
  useEffect(() => {
    fetchPosts(currentPage, POSTS_PER_PAGE);
    // fetchPosts is stable from zustand
  }, [currentPage]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleStatusChange = async (postId, status) => {
    await updatePostStatus(postId, status);
    // Refresh current page after update
    fetchPosts(currentPage, POSTS_PER_PAGE);
  };

  // ✅ Memoize posts to avoid unnecessary recalculation
  const displayedPosts = useMemo(() => posts || [], [posts]);

  const totalPages = postsMeta.totalPages || 1;

  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl font-bold mb-6">Post Management</h1>

      {postsLoading ? (
        <p>Loading posts...</p>
      ) : displayedPosts.length === 0 ? (
        <p className="text-gray-500">No posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedPosts.map((post) => (
            <div
              key={post._id || post.id}
              className="relative rounded-xl overflow-hidden shadow-lg group h-64 md:h-80 bg-gray-100"
            >
              <img
                src={post.images?.[0] || post.image || "/placeholder.png"}
                alt={post.title || "post image"}
                className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-20 transition duration-300" />
              <div className="absolute bottom-0 left-0 p-4 text-white z-10 w-full">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-sm">{post.description}</p>
                <p className="text-xs mt-1">
                  Posted by: {post.user?.fullName || post.user?.username}
                </p>
                <p className="text-xs">
                  Date: {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                </p>
                <p className="text-xs">Status: {post.status}</p>

                <div className="flex gap-2 mt-2">
                  {post.status !== "Removed" && (
                    <>
                      <button
                        className="bg-green-500 px-2 py-1 rounded text-white"
                        onClick={() => handleStatusChange(post._id || post.id, "Approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-500 px-2 py-1 rounded text-white"
                        onClick={() => handleStatusChange(post._id || post.id, "Removed")}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-6 space-x-2 flex-wrap">
        {Array.from({ length: Math.max(1, totalPages) }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => handlePageChange(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
            disabled={postsLoading}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
