import React, { useState } from "react";
import { posts } from "../../data/post"; 
import { users } from "../../data/userData";

const POSTS_PER_PAGE = 8;

export default function Posts() {
  const [currentPage, setCurrentPage] = useState(1);

  const currentPosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl font-bold mb-6">Post Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentPosts.map((post) => {
          const user = users.find((u) => u.id === post.userId);

          return (
            <div
              key={post.id}
              className="relative rounded-xl overflow-hidden shadow-lg group h-64 md:h-80 bg-gray-100"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
              />
              {/* Reduced overlay opacity */}
              <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-20 transition duration-300" />
              <div className="absolute bottom-0 left-0 p-4 text-white z-10 w-full">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-sm">{post.description}</p>
                <p className="text-xs mt-1">Posted by: {user?.name}</p>
                <p className="text-xs">Date: {post.date}</p>
                <p className="text-xs">Status: {post.status}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => handlePageChange(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
