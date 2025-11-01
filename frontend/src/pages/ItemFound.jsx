import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from '../utils/postApi'; 
import LocationSelector from '../components/LocationSelector';

export default function FoundItemPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const type = 'found';
  
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
        // Ensure coordinates are in the correct format [longitude, latitude]
        const coordinates = locationData.coordinates || [locationData.longitude, locationData.latitude];
        
        setFormData(prev => ({
            ...prev,
            locationData: {
                ...locationData,
                coordinates: coordinates
            },
            location: locationData.address || `Location at ${locationData.latitude?.toFixed(6)}, ${locationData.longitude?.toFixed(6)}`
        }));
        console.log('✅ Location data updated:', coordinates);
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
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload only image files (JPEG, PNG, WebP)');
        return false;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for better compatibility
        setError('Image size should be less than 2MB');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setError('');
      setFormData(prev => ({ ...prev, images: validFiles }));
      setImagePreviews(validFiles.map(file => URL.createObjectURL(file)));
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
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

    // Enhanced validation
    if (!formData.locationData || !formData.locationData.coordinates) {
        setError('Please select a location on the map');
        setLoading(false);
        return;
    }

    try {
        // Prepare data for API
        const postData = {
            title: formData.itemName.trim(),
            description: formData.description.trim(),
            category: formData.category.toLowerCase(), // Ensure lowercase
            images: formData.images,
            locationData: {
                coordinates: formData.locationData.coordinates,
                address: formData.location,
                addressDetails: {}
            },
            locationFound: formData.location,
            foundDate: formData.date
        };

        const result = await createPost(postData, type);
        
        if (result.success) {
            setSuccess('Found item posted successfully! Redirecting...');
            // Reset form and redirect
            setTimeout(() => navigate('/'), 2000);
        } else {
            setError(result.error);
        }
    } catch (err) {
        console.error('Submission error:', err);
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-lg">❌</span>
              <span className="font-medium">{error}</span>
            </div>
            <p className="text-sm text-red-600 mt-2">
              💡 Try using smaller images (under 2MB) in JPEG or PNG format.
            </p>
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
            {formData.locationData && (
              <div className="mt-2 text-green-600 text-sm bg-green-50 p-2 rounded">
                ✅ Location selected: {formData.location}
              </div>
            )}
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
              placeholder="Describe the item including color, brand, condition, and any identifying features..."
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
                  accept="image/jpeg,image/png,image/webp"
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
            
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              <p>• Supported formats: JPEG, PNG, WebP</p>
              <p>• Max file size: 2MB per image</p>
              <p>• Recommended: Use landscape photos with good lighting</p>
            </div>
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
            
            {(!formData.locationData || !formData.images.length) && (
              <div className="mt-3 space-y-1">
                {!formData.locationData && (
                  <p className="text-red-600 text-sm">⚠️ Please select a location first</p>
                )}
                {!formData.images.length && (
                  <p className="text-red-600 text-sm">⚠️ Please upload at least one image</p>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}