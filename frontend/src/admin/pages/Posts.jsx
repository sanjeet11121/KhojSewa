// FILE: src/pages/admin/Posts.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
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

  // Resolve an image URL from various possible shapes/fields
  const resolveImageUrl = (post) => {
    let src = null;
    // Try common fields
    if (Array.isArray(post?.images) && post.images.length > 0) src = post.images[0];
    if (!src && Array.isArray(post?.photos) && post.photos.length > 0) src = post.photos[0];
    if (!src && Array.isArray(post?.media) && post.media.length > 0) src = post.media[0];
    if (!src) src = post?.thumbnail || post?.coverImage || post?.image || post?.imageUrl || post?.photo || null;

    // If it's an object, pull a likely URL field
    if (src && typeof src === "object") {
      src = src.url || src.secure_url || src.secureUrl || src.path || src.location || src.href || null;
    }

    // Nothing found -> placeholder
    if (!src || typeof src !== "string") return "/placeholder.png";

    // Already absolute
    const lower = src.toLowerCase();
    if (lower.startsWith("http://") || lower.startsWith("https://")) return src;
    if (lower.startsWith("//")) return `https:${src}`;

    // Relative path: ensure base URL prefix
    const base = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8000";
    if (src.startsWith("/")) return `${base}${src}`;
    // Handle paths like "uploads/..." without leading slash
    return `${base}/${src}`;
  };

  // ✅ Fetch posts on mount and when page changes
  useEffect(() => {
    fetchPosts(currentPage, POSTS_PER_PAGE);
    // fetchPosts is stable from zustand
  }, [currentPage]);

  const handlePageChange = (page) => setCurrentPage(page);

  // Permanently delete a post from the database via posts API
  const handleDeletePost = async (post) => {
    if (!post) return;
    const idCandidates = [post._id, post.id, post.postId, post.lostId, post.foundId].filter(Boolean);
    if (idCandidates.length === 0) return;
    if (!window.confirm("This will permanently delete the post. Continue?")) return;

    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("admin");

    const apiBase = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8000";

    const commonCfg = {
      withCredentials: true,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-HTTP-Method-Override': 'DELETE',
      },
    };

    // Candidates to try in order (to accommodate unknown backend route shape)
    const type = post.type === "found" ? "found" : "lost";
    const envLost = import.meta?.env?.VITE_DELETE_LOST_PATH || null; // e.g. /api/v1/posts/lost/:id
    const envFound = import.meta?.env?.VITE_DELETE_FOUND_PATH || null; // e.g. /api/v1/posts/found/:id

    const buildPathsForId = (postId) => ([
      // Env-configured patterns (if provided), replace :id
      ...(type === 'lost' && envLost ? [{ baseURL: apiBase, path: envLost.replace(':id', postId) }] : []),
      ...(type === 'found' && envFound ? [{ baseURL: apiBase, path: envFound.replace(':id', postId) }] : []),
      // Primary expected
      { baseURL: `${apiBase}/api/v1/posts`, path: `/${type}/${postId}` },
      // Admin namespace
      { baseURL: `${apiBase}/api/v1/admin/posts`, path: `/${type}/${postId}` },
      // Generic by id
      { baseURL: `${apiBase}/api/v1/posts`, path: `/${postId}` },
      { baseURL: `${apiBase}/api/v1/admin/posts`, path: `/${postId}` },
      // Delete suffix patterns
      { baseURL: `${apiBase}/api/v1/posts`, path: `/${type}/${postId}/delete` },
      { baseURL: `${apiBase}/api/v1/admin/posts`, path: `/${type}/${postId}/delete` },
      { baseURL: `${apiBase}/api/v1/posts`, path: `/delete/${postId}` },
      { baseURL: `${apiBase}/api/v1/admin/posts`, path: `/delete/${postId}` },
      // Query-string type
      { baseURL: `${apiBase}/api/v1/posts`, path: `/${postId}?type=${type}` },
      { baseURL: `${apiBase}/api/v1/admin/posts`, path: `/${postId}?type=${type}` },
      // Alternative resource names
      { baseURL: `${apiBase}/api/v1`, path: `/found-posts/${postId}` },
      { baseURL: `${apiBase}/api/v1`, path: `/lost-posts/${postId}` },
      { baseURL: `${apiBase}/api/v1/admin`, path: `/found-posts/${postId}` },
      { baseURL: `${apiBase}/api/v1/admin`, path: `/lost-posts/${postId}` },
      // Generic delete endpoints
      { baseURL: `${apiBase}/api/v1/posts`, path: `/delete?id=${postId}` },
      { baseURL: `${apiBase}/api/v1/admin/posts`, path: `/delete?id=${postId}` },
      { baseURL: `${apiBase}/api/v1`, path: `/posts/delete/${postId}` },
      { baseURL: `${apiBase}/api/v1/admin`, path: `/posts/delete/${postId}` },
    ]);

    const candidates = idCandidates.flatMap(buildPathsForId);

    let success = false;
    let lastError = null;
    for (const { baseURL, path } of candidates) {
      try {
        const client = axios.create({ baseURL, ...commonCfg });
        const url = `${baseURL}${path}`;
        // Helpful debug log for diagnosing 404s
        console.debug("Attempting DELETE:", url);
        await client.delete(path, { data: { type } });
        success = true;
        break;
      } catch (e) {
        lastError = e;
        // Try next candidate on 401/403/404; break immediately for 5xx network errors? keep trying anyway.
        try {
          // Some backends use POST for delete actions; try POST as a fallback
          const client = axios.create({ baseURL, ...commonCfg });
          const url = `${baseURL}${path}`;
          console.debug("Attempting POST as delete:", url);
          await client.post(path, { id: idCandidates[0], type });
          success = true;
          break;
        } catch (e2) {
          lastError = e2;
          continue;
        }
      }
    }

    if (success) {
      fetchPosts(currentPage, POSTS_PER_PAGE);
    } else {
      console.error("Failed to delete post", lastError);
      const msg = lastError?.response?.data?.message || lastError?.message || "Unknown error";
      alert(`Failed to delete the post: ${msg}`);
    }
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
              <div className="w-full h-full flex items-center justify-center bg-white">
                <img
                  src={resolveImageUrl(post)}
                  alt={post.title || "post image"}
                  className="max-h-full max-w-full object-contain p-2 transition duration-300"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src.endsWith('/placeholder.png')) return;
                    e.currentTarget.src = '/placeholder.png';
                  }}
                />
              </div>
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
                  <button
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
                    onClick={() => handleDeletePost(post)}
                    disabled={postsLoading}
                  >
                    Delete
                  </button>
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
