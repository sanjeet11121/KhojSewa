import React, { useState, useEffect } from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { api } from '../../config';
import { Sparkles } from 'lucide-react';

const MyPosts = () => {
  const [lostPosts, setLostPosts] = useState([]);
  const [foundPosts, setFoundPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

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
        setError('Network error - please check your connection');
        console.error('Fetch posts error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDeletePost = async (postId, type) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeletingId(postId);
    const accessToken = localStorage.getItem('accessToken');
    
    try {
      const endpoint = type === 'lost' ? 'lost' : 'found';
      const res = await fetch(`${api}/api/v1/posts/${endpoint}/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.ok) {
        if (type === 'lost') {
          setLostPosts(prev => prev.filter(p => p._id !== postId));
        } else {
          setFoundPosts(prev => prev.filter(p => p._id !== postId));
        }
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to delete post');
      }
    } catch (err) {
      alert('Network error - please try again');
      console.error('Delete post error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCardClick = (postId, type) => {
    navigate(`/post/${type}/${postId}`);
  };

  const handleEditClick = (postId, type, e) => {
    e.stopPropagation();
    navigate(`/user/edit/${postId}/${type}`);
  };

  const handleRecommendationsClick = (postId, e) => {
    e.stopPropagation();
    navigate(`/user/recommendations/${postId}`);
  };

  const handleClaimsClick = (postId, type, e) => {
    e.stopPropagation();
    navigate(`/user/claims/${postId}?type=${type}`);
  };

  const handleClaimsDashboardClick = (e) => {
    e.stopPropagation();
    navigate('/claims/dashboard');
  };

  if (loading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">My Posts</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">My Posts</h2>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (lostPosts.length === 0 && foundPosts.length === 0) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">My Posts</h2>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No posts found for your account.</p>
          <button 
            onClick={() => navigate('/post/lost')} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Create Your First Post
          </button>
        </div>
      </div>
    );
  }

  const PostCard = ({ post, type }) => (
    <div
      key={post._id}
      className="rounded-2xl shadow-xl bg-white border border-gray-200 flex flex-col overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
      onClick={() => handleCardClick(post._id, type)}
    >
      {/* Image Preview */}
      <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        {post.images && post.images.length > 0 ? (
          <img 
            src={post.images[0]} 
            alt={post.itemName || post.title || 'Post image'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="text-gray-400 flex items-center justify-center w-full h-full">
            No Image
          </div>
        )}
        {post.images && post.images.length > 0 && (
          <div className="hidden text-gray-400 items-center justify-center w-full h-full">
            No Image
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <span className="block text-xl font-bold mb-1 truncate text-purple-700">
          {post.itemName || post.title || 'Untitled Post'}
        </span>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {post.description || 'No description provided'}
        </p>
        
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
          <span>
            Date: {post.lostDate || post.foundDate 
              ? new Date(post.lostDate || post.foundDate).toLocaleDateString() 
              : 'N/A'
            }
          </span>
          <span>Category: {post.category || 'N/A'}</span>
        </div>
        
        <div className="flex gap-2 mt-auto">
          <button 
            title="Edit" 
            className="p-2 rounded-lg hover:bg-purple-100 transition disabled:opacity-50"
            onClick={(e) => handleEditClick(post._id, type, e)}
            disabled={deletingId === post._id}
          >
            <MdEdit className="h-5 w-5 text-purple-700" />
          </button>
          
          <button 
            title="Delete" 
            className="p-2 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePost(post._id, type);
            }}
            disabled={deletingId === post._id}
          >
            {deletingId === post._id ? (
              <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <MdDelete className="h-5 w-5 text-red-600" />
            )}
          </button>

          {type === 'lost' ? (
            <button 
              className="flex-1 py-2 px-3 rounded-lg bg-green-600 text-white font-semibold text-sm
                         hover:bg-green-700 active:bg-green-800 focus:outline-none 
                         focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                         transition-colors duration-200 disabled:opacity-50 
                         disabled:cursor-not-allowed flex items-center justify-center gap-1"
              onClick={(e) => handleRecommendationsClick(post._id, e)}
              disabled={deletingId === post._id}
            >
              <Sparkles className="w-4 h-4 animate-bounce" />
              <span>Recommendations</span>
            </button>
          ) : (
            <button 
              className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white font-semibold text-sm
                         hover:bg-blue-700 active:bg-blue-800 focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                         transition-colors duration-200 disabled:opacity-50 
                         disabled:cursor-not-allowed"
              onClick={(e) => handleClaimsClick(post._id, type, e)}
              disabled={deletingId === post._id}
            >
              See Claims
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-indigo-700">My Posts</h2>
      
      {/* Lost Posts Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-purple-700">Lost Posts ({lostPosts.length})</h3>
        {lostPosts.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No lost posts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lostPosts.map((post) => (
              <PostCard key={post._id} post={post} type="lost" />
            ))}
          </div>
        )}
      </div>

      {/* Found Posts Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-indigo-700">Found Posts ({foundPosts.length})</h3>
        {foundPosts.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No found posts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {foundPosts.map((post) => (
              <PostCard key={post._id} post={post} type="found" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPosts;