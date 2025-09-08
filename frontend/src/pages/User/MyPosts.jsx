import React, { useState, useEffect } from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { api } from '../../config';

const MyPosts = () => {
  const [lostPosts, setLostPosts] = useState([]);
  const [foundPosts, setFoundPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      try {
        const [lostRes, foundRes] = await Promise.all([
          fetch(`${api}/api/v1/posts/my/lost`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          fetch(`${api}/api/v1/posts/my/found`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        ]);
        const lostData = await lostRes.json();
        const foundData = await foundRes.json();
        console.log('Lost posts response:', lostData);
        console.log('Found posts response:', foundData);
        if (!lostRes.ok || !foundRes.ok) {
          setError((lostData.message || foundData.message) || 'Failed to fetch posts');
        } else {
          setLostPosts(Array.isArray(lostData.data) ? lostData.data : []);
          setFoundPosts(Array.isArray(foundData.data) ? foundData.data : []);
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">My Posts</h2>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">My Posts</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (lostPosts.length === 0 && foundPosts.length === 0) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">My Posts</h2>
        <p className="text-gray-600">No posts found for your account.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-indigo-700">My Posts</h2>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-purple-700">Lost Posts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lostPosts.length === 0 ? (
            <p className="text-gray-500">No lost posts found.</p>
          ) : (
            lostPosts.map((post) => (
              <div
                key={post._id}
                className="rounded-2xl shadow-xl bg-white border border-gray-200 flex flex-col overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                onClick={e => {
                  // Prevent navigation if clicking edit/delete/recommendation buttons
                  if (e.target.closest('button')) return;
                  navigate(`/post/lost/${post._id}`);
                }}
              >
                {/* Image Preview */}
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {post.images && post.images.length > 0 ? (
                    <img src={post.images[0]} alt="Post Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400">No Image</div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <span className="block text-xl font-bold text-purple-700 mb-1">{post.itemName || post.title}</span>
                  <p className="text-gray-600 text-sm mb-2">{post.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                    <span>Date: {post.lostDate ? new Date(post.lostDate).toLocaleDateString() : 'N/A'}</span>
                    <span>Category: {post.category || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button title="Edit" className="p-2 rounded-lg hover:bg-purple-100 transition" onClick={() => navigate(`/user/edit/${post._id}/lost`)}>
                      <MdEdit className="h-6 w-6 text-purple-700" />
                    </button>
                    <button title="Delete" className="p-2 rounded-lg hover:bg-red-100 transition" onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this post?')) {
                        const accessToken = localStorage.getItem('accessToken');
                        try {
                          const res = await fetch(`${api}/api/v1/posts/lost/${post._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${accessToken}` }
                          });
                          if (res.ok) {
                            setLostPosts(lostPosts.filter(p => p._id !== post._id));
                          } else {
                            alert('Failed to delete post');
                          }
                        } catch {
                          alert('Network error');
                        }
                      }
                    }}>
                      <MdDelete className="h-6 w-6 text-red-600" />
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition" onClick={() => navigate(`/user/recommendations/${post._id}`)}>See Recommendations</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-indigo-700">Found Posts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {foundPosts.length === 0 ? (
            <p className="text-gray-500">No found posts found.</p>
          ) : (
            foundPosts.map((post) => (
              <div
                key={post._id}
                className="rounded-2xl shadow-xl bg-white border border-gray-200 flex flex-col overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                onClick={e => {
                  if (e.target.closest('button')) return;
                  navigate(`/post/found/${post._id}`);
                }}
              >
                {/* Image Preview */}
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {post.images && post.images.length > 0 ? (
                    <img src={post.images[0]} alt="Post Preview" className="w-full h-full object-cover" />
                  ) : post.image ? (
                    <img src={post.image} alt="Post Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400">No Image</div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <span className="block text-xl font-bold text-indigo-700 mb-1">{post.itemName || post.title}</span>
                  <p className="text-gray-600 text-sm mb-2">{post.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                    <span>Date: {post.foundDate ? new Date(post.foundDate).toLocaleDateString() : 'N/A'}</span>
                    <span>Category: {post.category || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button title="Edit" className="p-2 rounded-lg hover:bg-purple-100 transition" onClick={() => navigate(`/user/edit/${post._id}/found`)}>
                      <MdEdit className="h-6 w-6 text-purple-700" />
                    </button>
                    <button title="Delete" className="p-2 rounded-lg hover:bg-red-100 transition" onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this post?')) {
                        const accessToken = localStorage.getItem('accessToken');
                        try {
                          const res = await fetch(`${api}/api/v1/posts/found/${post._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${accessToken}` }
                          });
                          if (res.ok) {
                            setFoundPosts(foundPosts.filter(p => p._id !== post._id));
                          } else {
                            alert('Failed to delete post');
                          }
                        } catch {
                          alert('Network error');
                        }
                      }
                    }}>
                      <MdDelete className="h-6 w-6 text-red-600" />
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition" onClick={() => navigate(`/user/claims/${post._id}`)}>See Claims</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};



export default MyPosts;