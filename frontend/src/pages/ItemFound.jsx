import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '../config.js';
import LocationSelector from '../components/LocationSelector';

export default function FoundItemPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/signin');
    }
  }, [navigate]);

  const categories = ['electronics', 'stationeries', 'clothing', 'food', 'toys', 'other'];
  const [formData, setFormData] = useState({
    itemName: "",
    location: "",
    locationData: null,
    description: "",
    date: "",
    category: "",
    images: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (locationData) => {
    console.log('📍 Location selected:', locationData);
    
    if (locationData) {
      setFormData(prev => ({
        ...prev,
        locationData: locationData,
        location: locationData.address || `Location at ${locationData.latitude?.toFixed(6)}, ${locationData.longitude?.toFixed(6)}`
      }));
      console.log('✅ Location data updated');
    } else {
      setFormData(prev => ({
        ...prev,
        locationData: null,
        location: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setFormData(prev => ({ ...prev, images: files }));
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setFormData(prev => ({ ...prev, images: newImages }));
    setImagePreviews(newPreviews);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);

  console.log('🚀 Starting form submission...');

  // Validation
  if (!formData.locationData) {
    setError('Please select a location on the map');
    setLoading(false);
    return;
  }

  if (formData.images.length === 0) {
    setError('Please upload at least one image');
    setLoading(false);
    return;
  }

  if (!formData.itemName.trim()) {
    setError('Please enter item name');
    setLoading(false);
    return;
  }

  if (!formData.category) {
    setError('Please select category');
    setLoading(false);
    return;
  }

  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('You must be logged in');
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.itemName);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('locationFound', formData.location);
    formDataToSend.append('foundDate', formData.date);
    formDataToSend.append('category', formData.category);
    
    // FIX: Ensure location data is properly formatted
    const locationData = {
      coordinates: formData.locationData.coordinates, // [longitude, latitude]
      latitude: formData.locationData.latitude,
      longitude: formData.locationData.longitude,
      address: formData.locationData.address,
      addressDetails: formData.locationData.addressDetails
    };
    
    console.log('📍 Location data being sent:', locationData);
    formDataToSend.append('location', JSON.stringify(locationData));
    
    // Append images
    formData.images.forEach((img) => {
      formDataToSend.append('images', img);
    });

    // Debug what we're sending
    console.log('🔍 Data being sent to server:');
    for (let [key, value] of formDataToSend.entries()) {
      if (key === 'images') {
        console.log(`🔍 ${key}:`, value.name, value.type, value.size);
      } else {
        console.log(`🔍 ${key}:`, value);
      }
    }

    console.log('📤 Sending request to server...');
    
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const response = await fetch(`${api}/api/v1/posts/found`, {
      method: 'POST',
      headers: { 
        'Authorization': authToken,
      },
      body: formDataToSend,
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);

    let data;
    try {
      data = await response.json();
      console.log('📥 FULL Response data:', data);
    } catch (parseError) {
      console.error('❌ Error parsing response:', parseError);
      throw new Error('Server returned invalid JSON response');
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || (data.errors && data.errors[0]?.msg) || `Server error: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Success case
    setSuccess('Found item posted successfully! Redirecting...');
    
    // Reset form
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
    
    // Redirect after success
    setTimeout(() => navigate('/'), 2000);

  } catch (err) {
    console.error('❌ Submission error:', err);
    setError(err.message || 'Failed to post found item. Please try again.');
  } finally {
    setLoading(false);
  }
};
  return (
    <section className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-purple-700 text-center mb-6">
          Report a Found Item
        </h2>

        {/* Status Panel
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Form Status:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div><strong>Location:</strong> {formData.locationData ? '✅ Selected' : '❌ Not selected'}</div>
            <div><strong>Images:</strong> {formData.images.length > 0 ? `✅ ${formData.images.length} uploaded` : '❌ No images'}</div>
            <div><strong>All Fields:</strong> {formData.itemName && formData.category && formData.description && formData.date ? '✅ Complete' : '❌ Incomplete'}</div>
          </div>
        </div> */}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-lg">❌</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <span className="text-lg">✅</span>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Name */}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. iPhone 13, blue backpack"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Location Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Where did you find this item? *
            </label>
            <LocationSelector
              onLocationSelect={handleLocationSelect}
              initialLocation={formData.locationData}
              required={true}
            />
          </div>

          {/* Description */}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Describe the item..."
            />
          </div>

          {/* Date */}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Images (Required, up to 3) *
            </label>
            <div className="flex items-center gap-4 mb-4">
              <label className="inline-flex items-center gap-2 cursor-pointer px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors">
                <span>📷 Choose Images</span>
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
              <div className="flex gap-4 flex-wrap">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img 
                      src={src} 
                      alt={`preview-${idx}`} 
                      className="h-24 w-24 object-cover rounded-lg border-2 border-purple-200" 
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center pt-6">
            <button
              type="submit"
              disabled={loading || !formData.images.length || !formData.locationData}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                (!formData.images.length || !formData.locationData || loading) 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Posting Found Item...
                </div>
              ) : (
                'Submit Found Item'
              )}
            </button>
            
            {/* {(!formData.locationData || !formData.images.length) && (
              <div className="mt-3 space-y-1">
                {!formData.locationData && (
                  <p className="text-red-600 text-sm">⚠️ Please select a location first</p>
                )}
                {!formData.images.length && (
                  <p className="text-red-600 text-sm">⚠️ Please upload at least one image</p>
                )}
              </div>
            )} */}
          </div>
        </form>
      </div>
    </section>
  );
}