import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '../config.js';
import LocationSelector from '../components/LocationSelector';

export default function FoundItemPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/signin');
    }
  }, [navigate]);

  // Use backend enum values (lowercase)
  const categories = ['electronics', 'stationeries', 'clothing', 'food', 'toys', 'other'];
  const [formData, setFormData] = useState({
    itemName: "",
    location: "", // Text location for backward compatibility
    locationData: null, // New location data from map
    description: "",
    date: "",
    category: "",
    images: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      locationData: locationData,
      location: locationData.address || prev.location // Update text location with address
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // max 3 images
    setFormData({ ...formData, images: files });
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
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
      if (!token || !userString) {
        setError('You must be logged in to post a found item');
        setLoading(false);
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
        return;
      }

      // Validation: category and image required
      if (!formData.category || !categories.includes(formData.category.toLowerCase())) {
        setError('Please select a valid category.');
        setLoading(false);
        return;
      }
      if (!formData.images || formData.images.length === 0) {
        setError('Image is required for found posts.');
        setLoading(false);
        return;
      }
      if (!formData.locationData) {
        setError('Please select a location on the map.');
        setLoading(false);
        return;
      }

      // Prepare form data
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.itemName);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('locationFound', formData.location);
      formDataToSend.append('foundDate', formData.date);
      formDataToSend.append('category', formData.category.toLowerCase());
      
      // Append location data as JSON string
      formDataToSend.append('location', JSON.stringify(formData.locationData));
      
      // Append up to 3 images
      formData.images.forEach((img) => {
        formDataToSend.append('images', img);
      });

      // Auth header
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const res = await fetch(`${api}/api/v1/posts/found`, {
        method: 'POST',
        headers: {
          'Authorization': authToken
        },
        body: formDataToSend,
        credentials: 'include'
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || (data.errors && data.errors[0]?.msg) || 'Failed to post found item');
      } else {
        setSuccess('Found item posted successfully!');
        setFormData({
          itemName: '',
          category: '',
          location: '',
          locationData: null,
          date: '',
          description: '',
          images: [],
        });
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError('Network error: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-purple-700 text-center mb-6">
          Report a Found Item
        </h2>
        {error && <div className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-lg">{error}</div>}
        {success && <div className="text-green-600 text-sm mb-4 text-center bg-green-50 p-3 rounded-lg">{success}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              required
              placeholder="e.g. iPhone 13, blue backpack"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Location Selector */}
          <div>
            <LocationSelector
              onLocationSelect={handleLocationSelect}
              initialLocation={formData.locationData}
              label="Where did you find this item? *"
              required={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="e.g. Black wallet with three cards inside, found near cafeteria. Include any distinguishing features..."
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Found *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              max={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Images (Required, up to 3) *
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-block cursor-pointer px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                📷 Choose Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
              </label>
              <span className="text-sm text-gray-500">
                {formData.images.length} / 3 images selected
              </span>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="mt-4 flex gap-4 flex-wrap">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img 
                      src={src} 
                      alt={`preview-${idx}`} 
                      className="h-24 w-24 object-cover rounded-lg border-2 border-purple-200" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = [...formData.images];
                        const newPreviews = [...imagePreviews];
                        newImages.splice(idx, 1);
                        newPreviews.splice(idx, 1);
                        setFormData({...formData, images: newImages});
                        setImagePreviews(newPreviews);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="mt-2 text-sm text-gray-500">
              Upload clear photos of the found item. First image will be used as the main photo.
            </p>
          </div>

          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={loading || !formData.images || formData.images.length === 0 || !formData.locationData}
              className={`bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                (!formData.images || formData.images.length === 0 || !formData.locationData) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Posting...
                </div>
              ) : (
                'Submit Found Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}