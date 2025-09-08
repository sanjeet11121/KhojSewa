import { useState, useEffect } from 'react';
import { api } from '../config.js';
import noImage from "../assets/no-image.png";

export default function LostItemsSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLostPosts = async () => {
      try {
        const res = await fetch(`${api}/api/v1/posts/lost`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Failed to fetch posts');
        } else {
          setPosts(data.data || []);
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchLostPosts();
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-gradient-to-b from-purple-100 via-white to-white py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lost items...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-gradient-to-b from-purple-100 via-white to-white py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-gradient-to-b from-purple-100 via-white to-white py-12 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-purple-700 mb-4">
          Recently Reported Lost Items
        </h2>
        <p className="text-gray-600 text-base sm:text-lg">
          Browse through the latest lost item posts in your area.
        </p>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No lost items reported yet.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white shadow-xl rounded-2xl overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <img
                src={post.images && post.images.length > 0 ? post.images[0] : noImage}
                alt={post.images && post.images.length > 0 ? post.title : "No image available"}
                className="w-full h-48 object-cover"
              />
              <div className="p-5 text-left">
                <h3 className="text-xl font-semibold text-purple-800 mb-1">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Location:</span> {post.locationLost}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Date:</span> {new Date(post.lostDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Category:</span> {post.category}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Posted by:</span> {post.user?.fullName || 'Anonymous'}
                </p>
                <div className="flex gap-3">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm rounded-lg shadow-sm">
                    Contact
                  </button>
                  <button
                    className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-4 py-2 text-sm rounded-lg shadow-sm"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/post/lost/${post._id}`;
                      if (navigator.share) {
                        navigator.share({
                          title: post.title,
                          text: `Lost item: ${post.title}`,
                          url: shareUrl
                        });
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        alert('Post link copied to clipboard!');
                      }
                    }}
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}