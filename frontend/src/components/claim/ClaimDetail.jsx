// components/claim/ClaimDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { claimApi } from '../../utils/claimApi';

const ClaimDetail = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    loadClaim();
  }, [claimId]);

  const loadClaim = async () => {
    const result = await claimApi.getClaimDetails(claimId);
    if (result.success) {
      setClaim(result.data);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSendingMessage(true);
    const result = await claimApi.sendMessage(claimId, message);
    
    if (result.success) {
      setMessage('');
      loadClaim(); // Refresh to get new message
    }
    setSendingMessage(false);
  };

  const handleUpdateStatus = async (status) => {
    if (status === 'rejected' && !statusNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setUpdatingStatus(true);
    const result = await claimApi.updateClaimStatus(claimId, status, statusNotes);
    
    if (result.success) {
      setClaim(result.data);
      setStatusNotes('');
      alert('Claim status updated successfully');
    }
    setUpdatingStatus(false);
  };

  const isPostOwner = claim?.postOwner?._id === localStorage.getItem('userId');
  const isClaimant = claim?.claimant?._id === localStorage.getItem('userId');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Claim not found</h2>
        <button 
          onClick={() => navigate('/claims')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Claims
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/claims')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Claims
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Claim Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Post Information</h3>
            <p className="text-gray-700">{claim.post?.title}</p>
            <p className="text-gray-600 text-sm">{claim.post?.description}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Claimant</h3>
            <p className="text-gray-700">{claim.claimant?.fullName}</p>
            <p className="text-gray-600 text-sm">{claim.claimant?.email}</p>
            {claim.claimant?.phoneNumber && (
              <p className="text-gray-600 text-sm">{claim.claimant?.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Claim Message</h3>
          <p className="text-gray-700 bg-gray-50 p-4 rounded">{claim.claimMessage}</p>
        </div>

        {claim.evidence && claim.evidence.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Evidence</h3>
            <div className="space-y-2">
              {claim.evidence.map((evidence, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700">{evidence.description}</p>
                  {evidence.url && (
                    <a 
                      href={evidence.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View Evidence
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isPostOwner && claim.status === 'pending' && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Update Claim Status</h3>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Add notes about your decision (required for rejection)..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdateStatus('approved')}
                disabled={updatingStatus}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateStatus('rejected')}
                disabled={updatingStatus || !statusNotes.trim()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleUpdateStatus('under_review')}
                disabled={updatingStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Under Review
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Section */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Messages</h3>
        
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {claim.messages?.map((msg, index) => (
            <div key={index} className={`p-3 rounded-lg ${
              msg.sender._id === localStorage.getItem('userId') 
                ? 'bg-blue-50 ml-8' 
                : 'bg-gray-50 mr-8'
            }`}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-gray-700">
                  {msg.sender.fullName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{msg.message}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sendingMessage || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClaimDetail;