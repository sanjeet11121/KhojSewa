import React, { useEffect, useState } from "react";
import { getPosts, updatePostStatus } from "../services/adminApi";

const POSTS_PER_PAGE = 8;

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async (page) => {
    try {
      const data = await getPosts(page, POSTS_PER_PAGE);
      setPosts(data.posts);        // backend returns paginated posts
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleStatusChange = async (postId, status) => {
    try {
      await updatePostStatus(postId, status);
      // Refresh posts after update
      fetchPosts(currentPage);
    } catch (error) {
      console.error("Failed to update post status", error);
    }
  };

  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl font-bold mb-6">Post Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div
            key={post._id}
            className="relative rounded-xl overflow-hidden shadow-lg group h-64 md:h-80 bg-gray-100"
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-20 transition duration-300" />
            <div className="absolute bottom-0 left-0 p-4 text-white z-10 w-full">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-sm">{post.description}</p>
              <p className="text-xs mt-1">Posted by: {post.user?.fullName}</p>
              <p className="text-xs">Date: {new Date(post.createdAt).toLocaleDateString()}</p>
              <p className="text-xs">Status: {post.status}</p>

              {/* Admin Actions */}
              <div className="flex gap-2 mt-2">
                {post.status !== "Removed" && (
                  <>
                    <button
                      className="bg-green-500 px-2 py-1 rounded text-white"
                      onClick={() => handleStatusChange(post._id, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-500 px-2 py-1 rounded text-white"
                      onClick={() => handleStatusChange(post._id, "Removed")}
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

      {/* Pagination */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => handlePageChange(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
