// components/ClaimButton.jsx
import React, { useState } from 'react';
import { claimApi } from '../utils/claimApi';

const ClaimButton = ({ post, postType }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claimData, setClaimData] = useState({
    claimMessage: '',
    contactInfo: {
      phone: '',
      email: '',
      preferredContact: 'email'
    }
  });

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Correct way to use claimApi
  const result = await claimApi.createClaim({
    postId: post._id,
    postType: postType,
    claimMessage: claimData.claimMessage,
    contactInfo: claimData.contactInfo
  });

  if (result.success) {
    setShowForm(false);
    alert('Claim submitted successfully!');
    setClaimData({
      claimMessage: '',
      contactInfo: { phone: '', email: '', preferredContact: 'email' }
    });
  } else {
    alert(result.error || 'Failed to submit claim');
  }
  setLoading(false);
};
  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
      >
        Claim This Item
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Claim This Item
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you believe this is your item? *
                </label>
                <textarea
                  required
                  value={claimData.claimMessage}
                  onChange={(e) => setClaimData(prev => ({
                    ...prev,
                    claimMessage: e.target.value
                  }))}
                  placeholder="Describe specific details that prove this item belongs to you..."
                  className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={claimData.contactInfo.phone}
                    onChange={(e) => setClaimData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={claimData.contactInfo.email}
                    onChange={(e) => setClaimData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !claimData.claimMessage.trim()}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ClaimButton;