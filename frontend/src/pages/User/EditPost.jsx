
import { useEffect, useState } from "react";
import { MdDelete } from 'react-icons/md';
import { useParams, useNavigate } from "react-router-dom";
import { api } from '../../config.js';
  // Use backend enum values (lowercase)
  const categories = ['electronics', 'stationeries', 'clothing', 'food', 'toys', 'other'];

export default function EditPost() {
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const { postId, type } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${api}/api/v1/posts/${type}/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Failed to fetch post');
        } else {
          setFormData(data.data);
          // Set existing images for preview/removal
          if (data.data.images && Array.isArray(data.data.images)) {
            setExistingImages(data.data.images);
          } else if (data.data.image) {
            setExistingImages([data.data.image]);
          } else {
            setExistingImages([]);
          }
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, type]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
  const files = Array.from(e.target.files).slice(0, 3);
  setFormData({ ...formData, images: files });
  setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();
      // Always set 'title' from 'itemName' or 'title' for backend compatibility
      const titleValue = formData.itemName || formData.title || '';
      formDataToSend.append('title', titleValue);
      // Send only images that are not deleted
      for (const key in formData) {
        if (key === 'images' && Array.isArray(formData.images)) {
          if (type === 'found') {
            if (formData.images.length > 0) {
              formDataToSend.append('image', formData.images[0]);
            }
          } else if (type === 'lost') {
            formData.images.forEach(img => formDataToSend.append('images', img));
          }
        } else if (key === 'category') {
          formDataToSend.append('category', (formData.category || '').toLowerCase());
        } else if (key !== 'itemName' && key !== 'title') {
          formDataToSend.append(key, formData[key]);
        }
      }
      // Add existing images that were not deleted
      if (existingImages.length > 0) {
        existingImages.forEach(img => formDataToSend.append('existingImages', img));
      }
      const res = await fetch(`${api}/api/v1/posts/${type}/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to update post');
      } else {
        setSuccess('Post updated successfully!');
        setTimeout(() => navigate('/user/dashboard'), 1500);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!formData) return null;

  return (
    <section className="w-full bg-gradient-to-b from-purple-100 via-white to-white py-12 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">Edit {type === 'found' ? 'Found' : 'Lost'} Post</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-1 text-purple-700">Item Name</label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName || formData.title || ''}
              onChange={handleChange}
              required
              placeholder="e.g. iPhone 13, blue backpack"
              className="w-full border border-purple-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-purple-700">Description</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} className="w-full border border-purple-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-purple-700">Location {type === 'found' ? 'Found' : 'Lost'}</label>
            <input type="text" name={type === 'found' ? 'locationFound' : 'locationLost'} value={formData[type === 'found' ? 'locationFound' : 'locationLost'] || ''} onChange={handleChange} className="w-full border border-purple-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-purple-700">Date</label>
            <input type="date" name={type === 'found' ? 'foundDate' : 'lostDate'} value={formData[type === 'found' ? 'foundDate' : 'lostDate'] ? formData[type === 'found' ? 'foundDate' : 'lostDate'].slice(0,10) : ''} onChange={handleChange} className="w-full border border-purple-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-purple-700">Category</label>
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                required
                className="w-full border border-purple-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-purple-700">Images</label>
            <input type="file" name="images" multiple accept="image/*" onChange={handleImageUpload} className="w-full border border-purple-300 rounded-lg px-4 py-2" />
            {/* Preview newly selected images */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 mt-2">
                {imagePreviews.map((src, idx) => (
                  <img key={idx} src={src} alt={`preview-${idx}`} className="h-20 w-20 object-cover rounded border" />
                ))}
              </div>
            )}
            {/* Preview existing images with delete option */}
            {imagePreviews.length === 0 && existingImages.length > 0 && (
              <div className="flex gap-2 mt-2">
                {existingImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt={`existing-img-${idx}`} className="h-20 w-20 object-cover rounded border" />
                    <button type="button" className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-100" onClick={() => {
                      setExistingImages(existingImages.filter((_, i) => i !== idx));
                    }}>
                      <MdDelete className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition">Update Post</button>
          {success && <p className="mt-4 text-green-600 text-center">{success}</p>}
          {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
        </form>
      </div>
    </section>
  );
}
