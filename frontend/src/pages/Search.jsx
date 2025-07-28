import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config.js';

const LostItemPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Electronics',
    location: '',
    date: '',
    description: '',
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = ['Electronics', 'Stationeries', 'Clothing', 'Food', 'Toys', 'Other'];

  

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/signin');
    }
    // Log token for debugging
    console.log('Token available:', !!token);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // max 3 images
    setFormData(prev => ({ ...prev, images: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Get user data from localStorage
      const userString = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      console.log('Token when submitting:', token);
      
      if (!token || !userString) {
        setError('You must be logged in to post a lost item');
        setLoading(false);
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
        return;
      }
      
      // Parse user data
      const user = JSON.parse(userString);

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.itemName); // Changed from 'itemName' to 'title' to match backend
      formDataToSend.append('category', formData.category);
      formDataToSend.append('locationLost', formData.location); // Changed from 'location' to 'locationLost' to match backend
      formDataToSend.append('lostDate', formData.date); // Changed from 'date' to 'lostDate' to match backend
      formDataToSend.append('description', formData.description);

      formData.images.forEach((image) => {
        formDataToSend.append('images', image);
      });
      
      console.log('FormData fields:');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      // Log the token to verify its format
      console.log('Token format check:', token);
      
      // Check if token already has Bearer prefix
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log('Final auth token being sent:', authToken);
      
      const res = await fetch(`${api}/api/v1/posts/lost`, {
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
        setError(data.message || 'Failed to post lost item');
      } else {
        setSuccess('Lost item posted successfully!');
        setFormData({
          itemName: '',
          category: 'Electronics',
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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Report Lost Item
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Fill out the details to report your lost item.
          </p>
        </div>

        {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
        {success && <div className="text-green-600 text-sm mb-4 text-center">{success}</div>}

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Item Name */}
              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
                  Item Name
                </label>
                <input
                  type="text"
                  name="itemName"
                  id="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. iPhone 13, Backpack, etc."
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Where did you lose it?
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Main Library, Cafeteria, Room 203"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date Lost
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Brand, color, model, any special marks..."
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (Optional, Max 3)
                </label>
                <div className="flex items-center">
                  <label
                    htmlFor="imageUpload"
                    className="cursor-pointer inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Choose Files
                  </label>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {formData.images.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {formData.images.map((file, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="h-20 w-20 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Posting...' : 'Post Lost Item'}
                </button>
              </div>
            </form>
          </div>
        </div>

       

      </div>
    </div>
  );
};

export default LostItemPage;
