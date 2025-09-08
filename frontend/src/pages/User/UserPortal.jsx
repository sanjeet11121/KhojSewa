import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserPortal = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return navigate("/signin");

    fetch("http://localhost:8000/api/v1/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data.data));

    fetch("http://localhost:8000/api/v1/posts/my", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPosts(data.data));
  }, [navigate]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user.fullName}</h2>
      <div className="mb-6">
        <p>Email: {user.email}</p>
        {/* Add more profile info here */}
      </div>
      <h3 className="text-xl font-semibold mb-2">Your Posts</h3>
  {/* Debug: Show raw post data for troubleshooting */}
  <pre className="bg-gray-100 p-2 mb-4 text-xs overflow-x-auto">{JSON.stringify(posts, null, 2)}</pre>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {posts.map(post => (
          <div key={post._id} className="bg-white rounded-xl shadow p-4 flex flex-col">
            <div className="flex gap-2 mb-2">
              {/* Robust image display: show all images if array, fallback to single image */}
              {Array.isArray(post.images) && post.images.length > 0 ? (
                post.images.map((img, idx) => (
                  img ? <img key={idx} src={img} alt={`post-img-${idx}`} className="h-24 w-24 object-cover rounded border" /> : null
                ))
              ) : post.image ? (
                <img src={post.image} alt="post-img" className="h-24 w-24 object-cover rounded border" />
              ) : (
                <div className="h-24 w-24 bg-gray-100 flex items-center justify-center text-gray-400 border rounded">No Image</div>
              )}
            </div>
            <div className="font-semibold text-lg mb-1">{post.title || post.itemName}</div>
            <div className="text-sm text-gray-700 mb-2">{post.description}</div>
            <div className="text-xs text-gray-500 mt-auto">{post.type ? post.type.toUpperCase() : ''} | {post.status || ''}</div>
          </div>
        ))}
      </div>
      {/* Add more sections: claims, settings, etc. */}
    </div>
  );
};

export default UserPortal;
