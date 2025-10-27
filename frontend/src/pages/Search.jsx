import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config.js';
import LocationSelector from '../components/LocationSelector';

const LostItemPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Electronics',
    location: '',
    locationData: null,
    date: '',
    description: '',
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [locationError, setLocationError] = useState('');

  const categories = ['Electronics', 'Stationeries', 'Clothing', 'Food', 'Toys', 'Other'];

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/signin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (locationData) => {
    console.log('Location selected in form:', locationData);
    
    if (locationData && locationData.coordinates) {
      setFormData(prev => ({
        ...prev,
        locationData: locationData,
        location: locationData.address || `Lat: ${locationData.latitude}, Lng: ${locationData.longitude}`
      }));
      setLocationError('');
    } else {
      setFormData(prev => ({
        ...prev,
        locationData: null,
        location: ''
      }));
      setLocationError('Please select a location on the map');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Report Lost Item
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Fill out the details to report your lost item.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-700 text-sm text-center">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-700 text-sm text-center">{success}</div>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Item Name */}
              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="itemName"
                  id="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., iPhone 13, Black Wallet, Blue Backpack"
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Location Selector */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Where did you lose this item? *
                </label>
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  initialLocation={formData.locationData}
                  required={true}
                />
                {locationError && (
                  <div className="mt-2 text-red-500 text-sm bg-red-50 p-2 rounded">
                    {locationError}
                  </div>
                )}
                {formData.locationData && (
                  <div className="mt-2 text-green-600 text-sm bg-green-50 p-2 rounded">
                    ✅ Location selected: {formData.location}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  When did you lose it? *
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  max={new Date().toISOString().slice(0, 16)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Provide detailed description: brand, color, size, model, serial numbers, distinguishing features, contents, etc."
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Be as detailed as possible to help people identify your item
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Images (Optional, Max 3)
                </label>
                <div className="flex items-center gap-4 mb-4">
                  <label
                    htmlFor="imageUpload"
                    className="cursor-pointer inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Choose Images
                  </label>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="text-sm text-gray-500">
                    {formData.images.length} / 3 images selected
                  </span>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={src}
                          alt={`Preview ${idx + 1}`}
                          className="h-32 w-full object-cover rounded-lg border-2 border-purple-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || !formData.locationData}
                  className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    !formData.locationData ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Posting Lost Item...
                    </div>
                  ) : (
                    'Post Lost Item'
                  )}
                </button>
                
                {!formData.locationData && (
                  <p className="mt-2 text-sm text-red-600 text-center">
                    Please select a location by clicking on the map or using search
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Your lost item will be visible to the community. People can contact you if they find it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LostItemPage;