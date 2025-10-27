import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { claimApi } from '../../utils/claimApi';
import Navbar from '../../components/Navbar';
import { 
  MdArrowBack, 
  MdCheckCircle, 
  MdCancel, 
  MdMessage, 
  MdPerson,
  MdSchedule,
  MdThumbUp,
  MdThumbDown,
  MdEmail,
  MdPhone,
  MdChat,
  MdWarning,
  MdInfo,
  MdAccessTime,
  MdStar
} from 'react-icons/md';

const ClaimsManagement = () => {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const postType = searchParams.get('type') || 'found';
  const [claims, setClaims] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingClaim, setUpdatingClaim] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchClaimsAndPost();
  }, [postId, postType]);

  const fetchClaimsAndPost = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching claims for post:', postId, 'type:', postType);
      
      const result = await claimApi.getPostClaims(postId, postType);
      
      console.log('Claims API response:', result);
      
      if (result.success) {
        setClaims(result.data || []);
        console.log('Claims loaded:', result.data);
      } else {
        setError(result.error || 'Failed to fetch claims');
      }

    } catch (err) {
      setError(err.message || 'Failed to load claims');
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fixed update claim status function
  const handleUpdateClaimStatus = async (claimId, status) => {
    if (status === 'rejected' && !statusUpdateNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setUpdatingClaim(claimId);
    try {
      console.log('Updating claim status:', claimId, status);
      
      const result = await claimApi.updateClaimStatus(claimId, status, statusUpdateNotes);
      
      console.log('Update status result:', result);

      if (result.success) {
        // Update local state
        setClaims(prev => prev.map(claim => 
          claim._id === claimId ? result.data : claim
        ));
        
        setStatusUpdateNotes('');
        setSelectedClaim(null);
        alert(`Claim ${status} successfully!`);
        
        // Refresh claims to get updated data
        fetchClaimsAndPost();
      } else {
        alert(result.error || 'Failed to update claim status');
      }
    } catch (err) {
      console.error('Error updating claim:', err);
      alert('Failed to update claim status. Please check if the backend server is running and CORS is configured properly.');
    } finally {
      setUpdatingClaim(null);
    }
  };

  // Add message to claim
  const handleSendMessage = async (claimId) => {
    if (!newMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      const result = await claimApi.sendMessage(claimId, newMessage.trim());
      
      if (result.success) {
        setNewMessage('');
        // Refresh claims to get updated messages
        fetchClaimsAndPost();
        if (selectedClaim && selectedClaim._id === claimId) {
          setSelectedClaim(prev => ({
            ...prev,
            messages: [...prev.messages, result.data]
          }));
        }
        alert('Message sent successfully!');
      } else {
        alert(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const getMLConfidence = (claim) => {
    // If we have stored ML matching data, use it exactly as the claimant saw it
    if (claim.matchingData) {
      const { confidence, score, breakdown } = claim.matchingData;
      
      console.log('Using stored ML data for claim:', {
        confidence,
        score,
        breakdown
      });
      
      // Use the exact same logic as in Recommendations.jsx
      let color, label;
      switch (confidence) {
        case 'high':
          color = 'green';
          label = 'High Confidence';
          break;
        case 'medium':
          color = 'yellow';
          label = 'Medium Confidence';
          break;
        case 'low':
          color = 'red';
          label = 'Low Confidence';
          break;
        default:
          color = 'gray';
          label = 'Unknown Confidence';
      }

      // Create factors array exactly like in recommendations
      const factors = [];
      if (breakdown) {
        if (breakdown.text > 0) factors.push(`Text: ${Math.round(breakdown.text * 100)}% match`);
        if (breakdown.category > 0) factors.push(`Category: ${Math.round(breakdown.category * 100)}% match`);
        if (breakdown.location > 0) factors.push(`Location: ${Math.round(breakdown.location * 100)}% match`);
        if (breakdown.date > 0) factors.push(`Date: ${Math.round(breakdown.date * 100)}% match`);
      }

      return {
        score: Math.round(score * 100), // Convert to percentage like in recommendations
        level: confidence,
        color,
        label,
        factors,
        breakdown,
        isML: true
      };
    }
    
    // If no ML data is available, show a neutral message
    console.log('No ML data found for claim:', claim._id);
    return {
      score: 0,
      level: 'unknown',
      color: 'gray',
      label: 'No ML Data',
      factors: ['Confidence data not available'],
      isML: false
    };
  };

  const calculateConfidenceScore = (claim) => {
    return getMLConfidence(claim);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <MdCheckCircle className="h-5 w-5" />;
      case 'rejected': return <MdCancel className="h-5 w-5" />;
      case 'under_review': return <MdAccessTime className="h-5 w-5" />;
      default: return <MdSchedule className="h-5 w-5" />;
    }
  };

  const formatStatusText = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Claim Detail Modal Component - IMPROVED VERSION
  const ClaimDetailModal = ({ claim, onClose }) => {
    const confidence = getMLConfidence(claim);
    
    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Claim Details</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Claimant Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdPerson className="h-5 w-5 text-purple-600" />
                Claimant Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">{claim.claimant?.fullName}</p>
                  <p className="text-sm text-gray-600">{claim.claimant?.email}</p>
                  {claim.claimant?.verified && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-1">
                      <MdStar className="h-3 w-3" />
                      Verified User
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {claim.contactInfo?.phone && (
                    <p className="flex items-center gap-2 text-sm">
                      <MdPhone className="h-4 w-4" />
                      {claim.contactInfo.phone}
                    </p>
                  )}
                  {claim.contactInfo?.email && (
                    <p className="flex items-center gap-2 text-sm">
                      <MdEmail className="h-4 w-4" />
                      {claim.contactInfo.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Claim Message */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdMessage className="h-5 w-5 text-purple-600" />
                Claim Description
              </h4>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {claim.claimMessage}
                </p>
              </div>
            </div>

            {/* ML Matching Confidence - Same as claimant saw */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdInfo className="h-5 w-5 text-blue-600" />
                ML Matching Confidence
                {confidence.isML ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    🎯 Same as claimant saw
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    No ML data
                  </span>
                )}
              </h4>
              
              <div className={`p-4 rounded-lg border-2 ${
                confidence.color === 'green' ? 'bg-green-50 border-green-200' :
                confidence.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                confidence.color === 'red' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                {/* Overall Confidence */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-semibold text-lg">{confidence.label}</span>
                    <p className="text-sm text-gray-600 mt-1">
                      This is the exact same confidence level the claimant saw when making this claim
                    </p>
                  </div>
                  <span className="text-2xl font-bold">{confidence.score}%</span>
                </div>

                {/* Detailed Breakdown - Same as in recommendations */}
                {confidence.breakdown && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">Similarity Breakdown:</div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Text Similarity</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.round(confidence.breakdown.text * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-700 font-medium w-12 text-right">
                            {Math.round(confidence.breakdown.text * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Category Match</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.round(confidence.breakdown.category * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-700 font-medium w-12 text-right">
                            {Math.round(confidence.breakdown.category * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Location Proximity</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-yellow-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.round(confidence.breakdown.location * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-700 font-medium w-12 text-right">
                            {Math.round(confidence.breakdown.location * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Date Relevance</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-purple-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.round(confidence.breakdown.date * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-700 font-medium w-12 text-right">
                            {Math.round(confidence.breakdown.date * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confidence Factors */}
                <div className="border-t pt-4 mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Key Factors:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {confidence.factors.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Section */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">Messages</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {claim.messages?.map((msg, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    msg.sender._id === localStorage.getItem('userId') 
                      ? 'bg-blue-50 ml-8' 
                      : 'bg-gray-50 mr-8'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-gray-700">
                        {msg.sender?.fullName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{msg.message}</p>
                  </div>
                ))}
                {(!claim.messages || claim.messages.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No messages yet</p>
                )}
              </div>

              {/* Send Message */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage(claim._id);
                    }
                  }}
                />
                <button
                  onClick={() => handleSendMessage(claim._id)}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Action Section */}
            {claim.status === 'pending' && (
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Update Claim Status</h4>
                <textarea
                  value={statusUpdateNotes}
                  onChange={(e) => setStatusUpdateNotes(e.target.value)}
                  placeholder="Add notes about your decision (required for rejection)..."
                  className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleUpdateClaimStatus(claim._id, 'approved')}
                    disabled={updatingClaim === claim._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updatingClaim === claim._id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <MdThumbUp className="h-5 w-5" />
                        Approve Claim
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleUpdateClaimStatus(claim._id, 'rejected')}
                    disabled={updatingClaim === claim._id || !statusUpdateNotes.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updatingClaim === claim._id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <MdThumbDown className="h-5 w-5" />
                        Reject Claim
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleUpdateClaimStatus(claim._id, 'under_review')}
                    disabled={updatingClaim === claim._id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updatingClaim === claim._id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <MdAccessTime className="h-5 w-5" />
                        Under Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-purple-700 font-medium">Loading claims...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Claims</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingClaims = claims.filter(claim => claim.status === 'pending');
  const underReviewClaims = claims.filter(claim => claim.status === 'under_review');
  const resolvedClaims = claims.filter(claim => !['pending', 'under_review'].includes(claim.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-8 px-4 pt-24">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-purple-700 hover:text-purple-800 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border hover:shadow-md transition-all w-fit"
          >
            <MdArrowBack className="h-5 w-5" />
            Back to My Posts
          </button>
          
          <div className="text-center lg:text-right">
            <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
            {post && (
              <p className="text-gray-600 mt-1">
                For: <span className="font-semibold">{post.title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-gray-900">{claims.length}</div>
            <div className="text-gray-600">Total Claims</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingClaims.length}</div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{underReviewClaims.length}</div>
            <div className="text-gray-600">Under Review</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {claims.filter(c => c.status === 'approved').length}
            </div>
            <div className="text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-red-600">
              {claims.filter(c => c.status === 'rejected').length}
            </div>
            <div className="text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Pending Claims Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MdSchedule className="h-6 w-6 text-yellow-600" />
              Pending Claims ({pendingClaims.length})
            </h2>
            {pendingClaims.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full">
                <MdWarning className="h-4 w-4" />
                Action Required
              </div>
            )}
          </div>

          {pendingClaims.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Claims</h3>
              <p className="text-gray-600">There are no pending claims requiring your attention.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pendingClaims.map((claim) => {
                const confidence = calculateConfidenceScore(claim);
                
                return (
                  <div key={claim._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                        <div 
                          className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          onClick={() => setSelectedClaim(claim)}
                        >
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <MdPerson className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {claim.claimant?.fullName || 'Anonymous User'}
                              {claim.claimant?.verified && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Verified
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {new Date(claim.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Confidence Badge */}
                          <div className={`px-4 py-2 rounded-full border font-semibold ${
                            confidence.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                            confidence.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            confidence.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {confidence.label} ({confidence.score}%)
                          </div>
                        </div>
                      </div>

                      {/* Claim Preview */}
                      <div 
                        className="bg-gray-50 rounded-xl p-4 mb-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setSelectedClaim(claim)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <MdMessage className="h-4 w-4 text-purple-600" />
                          <h4 className="font-semibold text-gray-800">Claim Description</h4>
                        </div>
                        <p className="text-gray-700 line-clamp-2">
                          {claim.claimMessage}
                        </p>
                        <p className="text-sm text-purple-600 mt-2">Click to view full details and take action</p>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setStatusUpdateNotes('');
                          }}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-semibold transition-all text-sm"
                        >
                          Review Claim Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Show other claims sections if needed */}
        {(underReviewClaims.length > 0 || resolvedClaims.length > 0) && (
          <div className="space-y-8">
            {underReviewClaims.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Under Review ({underReviewClaims.length})</h2>
                <div className="space-y-4">
                  {underReviewClaims.map(claim => (
                    <div 
                      key={claim._id} 
                      className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedClaim(claim)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{claim.claimant?.fullName}</h3>
                          <p className="text-gray-600 text-sm">{claim.claimMessage}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          {formatStatusText(claim.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resolvedClaims.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Resolved Claims ({resolvedClaims.length})</h2>
                <div className="space-y-4">
                  {resolvedClaims.map(claim => (
                    <div 
                      key={claim._id} 
                      className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedClaim(claim)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{claim.claimant?.fullName}</h3>
                          <p className="text-gray-600 text-sm">{claim.claimMessage}</p>
                          {claim.resolution?.notes && (
                            <p className="text-gray-500 text-xs mt-1">Notes: {claim.resolution.notes}</p>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          {formatStatusText(claim.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Claims Message */}
        {claims.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <div className="text-8xl mb-6">📭</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">No Claims Yet</h2>
            <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
              This post hasn't received any claims yet. When someone submits a claim, 
              it will appear here for your review.
            </p>
          </div>
        )}
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          onClose={() => {
            setSelectedClaim(null);
            setStatusUpdateNotes('');
            setNewMessage('');
          }}
        />
      )}
    </div>
  );
};

export default ClaimsManagement;