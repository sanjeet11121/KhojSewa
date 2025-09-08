import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../config.js";
import { MdArrowBack } from "react-icons/md";

export default function PostDetail() {
  const { postId, type } = useParams() || {};
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!postId || !type) {
          setError("Invalid post or type parameter.");
          setLoading(false);
          return;
        }
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${api}/api/v1/posts/${type}/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        let data = {};
        try {
          data = await res.json();
        } catch (jsonErr) {
          setError("Invalid response from server.");
          setLoading(false);
          return;
        }
        if (!res.ok || !data || !data.data) {
          setError((data && data.message) || "Failed to fetch post");
        } else {
          setPost(data.data);
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, type]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-purple-200">
      <div className="text-xl text-purple-700 animate-pulse">Loading...</div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-purple-200">
      <div className="text-xl text-red-600">{error}</div>
    </div>
  );
  if (!post) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-purple-200">
      <div className="text-xl text-gray-500">No post found.</div>
    </div>
  );

  // Images: found posts use images[] or image, lost posts use images[]
  const images =
    post && post.images && Array.isArray(post.images) && post.images.length > 0
      ? post.images.filter(Boolean)
      : post && post.image
      ? [post.image]
      : [];

  return (
    <section className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 py-10 px-2 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-0 overflow-hidden">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between px-8 py-6 bg-purple-50 border-b">
          <button
            className="flex items-center gap-2 text-purple-700 hover:underline font-medium"
            onClick={() => navigate(-1)}
          >
            <MdArrowBack className="h-5 w-5" />
            Back
          </button>
          <span className={`px-4 py-1 rounded-full text-sm font-semibold ${type === 'found' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{type === 'found' ? 'Found' : 'Lost'}</span>
        </div>
        {/* Main Content */}
        <div className="px-8 py-8 flex flex-col md:flex-row gap-8">
          {/* Image Gallery */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 w-full">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`post-img-${idx}`}
                      className="h-40 w-full object-cover rounded-xl border shadow group-hover:scale-105 transition-transform duration-200"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">No images available.</div>
            )}
          </div>
          {/* Details */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-purple-700 mb-2">
              {(post && (post.itemName || post.title)) || "No Title"}
            </h2>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mr-2">
                {post && post.category ? post.category : "Uncategorized"}
              </span>
              {post && post.status && (
                <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                  {post.status}
                </span>
              )}
            </div>
            <div className="mb-4 text-gray-700 text-base">
              <span className="font-semibold">Description:</span> {post && post.description ? post.description : "No description."}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Date:</span> {post && (post.foundDate ? new Date(post.foundDate).toLocaleDateString() : post.lostDate ? new Date(post.lostDate).toLocaleDateString() : "N/A")}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">{type === "found" ? "Location Found:" : "Location Lost:"}</span> {post && (type === "found" ? post.locationFound : post.locationLost) ? (type === "found" ? post.locationFound : post.locationLost) : "N/A"}
            </div>
            <div className="mb-2 text-gray-700 flex items-center gap-2">
              <span className="font-semibold">Posted by:</span>
              {post && post.user && post.user.avatar ? (
                <img src={post.user.avatar} alt="avatar" className="h-7 w-7 rounded-full border" />
              ) : null}
              <span>{
                post && post.user && (post.user.fullName || post.user.username)
                  ? (post.user.fullName || post.user.username)
                  : "Anonymous"
              }</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
