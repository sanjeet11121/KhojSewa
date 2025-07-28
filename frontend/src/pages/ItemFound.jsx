import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '../config.js';

export default function FoundItemPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/signin');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    itemName: "",
    location: "",
    description: "",
    date: "",
    category: "",
    images: [],
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // max 3 images
    setFormData({ ...formData, images: files });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Get user data from localStorage
      const userString = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      console.log('Token when submitting found item:', token);
      
      if (!token || !userString) {
        setError('You must be logged in to post a found item');
        setLoading(false);
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
        return;
      }
      
      // Parse user data
      const user = JSON.parse(userString);

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.itemName);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('locationFound', formData.location);
      formDataToSend.append('foundDate', formData.date);
      formDataToSend.append('category', formData.category);

      if (formData.images && formData.images.length > 0) {
        formDataToSend.append('image', formData.images[0]); // Only first image for found posts
      }
      
      console.log('FormData fields:');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      // Log the token to verify its format
      console.log('Token format check:', token);
      
      // Check if token already has Bearer prefix
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log('Final auth token being sent:', authToken);
      
      const res = await fetch(`${api}/api/v1/posts/found`, {
        method: 'POST',
        headers: {
          'Authorization': authToken
        },
        body: formDataToSend,
        credentials: 'include' // Include cookies in the request
      });
      
      console.log('Response status:', res.status);

      const data = await res.json();
      console.log('Response data:', data);
      
      if (!res.ok) {
        console.error('Error response:', data);
        setError(data.message || 'Failed to post found item');
      } else {
        setSuccess('Found item posted successfully!');
        setFormData({
          itemName: '',
          category: '',
          location: '',
          date: '',
          description: '',
          images: [],
        });
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      console.error('Error details:', err);
      setError('Network error: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-purple-700 text-center mb-6">
          Report a Found Item
        </h2>
        
        {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
        {success && <div className="text-green-600 text-sm mb-4 text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Item Name
            </label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              required
              placeholder="e.g. iPhone 13, blue backpack"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Wallet">Wallet</option>
              <option value="Documents">Documents</option>
              <option value="Clothing">Clothing</option>
              <option value="Jewelry">Jewelry</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Location Found
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="e.g. Westbrook Library, 2nd floor"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="e.g. Black wallet with three cards inside, found near cafeteria"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date Found
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Images (Optional, Max 3)
            </label>
            <label className="inline-block cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              Choose Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {formData.images.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {formData.images.length} image(s) selected.
              </p>
            )}
          </div>

          <div className="text-center">
            <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Submit Found Item'}
          </button>
          </div>
        </form>
      </div>
    </section>
  );
}
