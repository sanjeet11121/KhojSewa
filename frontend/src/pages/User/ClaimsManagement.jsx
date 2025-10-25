import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../config';
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
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingClaim, setUpdatingClaim] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');

  useEffect(() => {
    fetchClaimsAndPost();
  }, [postId]);

  const fetchClaimsAndPost = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Determine post type from URL or context
      const isLostPost = window.location.pathname.includes('/lost/');
      const postType = isLostPost ? 'lost' : 'found';
      
      // Fetch post details
      const postEndpoint = isLostPost ? 
        `${api}/api/v1/posts/lost/${postId}` : 
        `${api}/api/v1/posts/found/${postId}`;

      const postRes = await fetch(postEndpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (postRes.ok) {
        const postData = await postRes.json();
        setPost(postData.data);
      } else {
        console.error('Failed to fetch post:', postRes.status);
      }

      // Fetch claims for this post
      const claimsRes = await fetch(`${api}/api/v1/claims/post/${postId}?type=${postType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!claimsRes.ok) {
        const errorData = await claimsRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch claims');
      }

      const claimsData = await claimsRes.json();
      setClaims(claimsData.data || []);
      
    } catch (err) {
      setError(err.message || 'Failed to load claims');
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClaimStatus = async (claimId, status) => {
    if (!statusUpdateNotes.trim() && status === 'rejected') {
      alert('Please provide a reason for rejection');
      return;
    }

    setUpdatingClaim(claimId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${api}/api/v1/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          ownerMessage: statusUpdateNotes 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update claim status');
      }

      // Update local state
      setClaims(prev => prev.map(claim => 
        claim._id === claimId ? { 
          ...claim, 
          status, 
          ownerMessage: statusUpdateNotes,
          resolvedAt: new Date().toISOString()
        } : claim
      ));

      // Reset form
      setStatusUpdateNotes('');
      setSelectedClaim(null);

      // Show success message
      alert(`Claim ${status} successfully!`);
      
      // Refresh claims to get updated data
      fetchClaimsAndPost();

    } catch (err) {
      alert(err.message || 'Failed to update claim status');
      console.error('Error updating claim:', err);
    } finally {
      setUpdatingClaim(null);
    }
  };

  const startChatWithClaimant = (claim) => {
    // Navigate to chat with the claimant
    navigate('/chat', { 
      state: { 
        startChatWith: claim.claimedBy._id,
        claimId: claim._id 
      } 
    });
  };

  const getConfidenceLevel = (claim) => {
    // Enhanced confidence calculation based on your schema
    let score = 0;
    let factors = [];

    // Description quality (using description field from your schema)
    if (claim.description && claim.description.length > 100) {
      score += 0.2;
      factors.push('Detailed description');
    } else if (claim.description && claim.description.length > 50) {
      score += 0.1;
      factors.push('Good description');
    }

    // Contact information
    if (claim.contactInfo?.phone || claim.contactInfo?.email) {
      score += 0.2;
      factors.push('Contact info provided');
    }

    // Evidence provided
    if (claim.evidence && claim.evidence.length > 0) {
      score += 0.3;
      factors.push('Evidence provided');
    }

    // Timeliness (claim submitted close to post date)
    if (post && claim.createdAt) {
      const postDate = new Date(post.foundDate || post.lostDate);
      const claimDate = new Date(claim.createdAt);
      const daysDiff = Math.abs((claimDate - postDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        score += 0.3;
        factors.push('Very timely');
      } else if (daysDiff <= 3) {
        score += 0.2;
        factors.push('Timely submission');
      } else if (daysDiff <= 7) {
        score += 0.1;
        factors.push('Reasonable timing');
      }
    }

    // User credibility
    if (claim.claimedBy?.verified) {
      score += 0.2;
      factors.push('Verified user');
    }

    // Messages exchanged (engagement factor)
    if (claim.messages && claim.messages.length > 2) {
      score += 0.1;
      factors.push('Active communication');
    }

    // Meeting arrangements (seriousness factor)
    if (claim.meetingArrangements?.proposedDate || claim.meetingArrangements?.proposedLocation) {
      score += 0.2;
      factors.push('Meeting proposed');
    }

    // Cap score at 1.0
    score = Math.min(score, 1.0);

    // Determine confidence level
    if (score >= 0.8) return { level: 'very-high', score, color: 'green', label: 'Very High Confidence', factors };
    if (score >= 0.6) return { level: 'high', score, color: 'green', label: 'High Confidence', factors };
    if (score >= 0.4) return { level: 'medium', score, color: 'yellow', label: 'Medium Confidence', factors };
    if (score >= 0.2) return { level: 'low', score, color: 'orange', label: 'Low Confidence', factors };
    return { level: 'very-low', score, color: 'red', label: 'Very Low Confidence', factors };
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

  const ClaimDetailModal = ({ claim, onClose, onStatusUpdate }) => {
    const confidence = getConfidenceLevel(claim);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Claim Details</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
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
                  <p className="font-medium">{claim.claimedBy?.fullName}</p>
                  <p className="text-sm text-gray-600">{claim.claimedBy?.email}</p>
                  {claim.claimedBy?.verified && (
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
                  {claim.contactInfo?.preferredContact && (
                    <p className="text-sm text-gray-600">
                      Preferred contact: {claim.contactInfo.preferredContact}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Claim Description */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdMessage className="h-5 w-5 text-purple-600" />
                Claim Description
              </h4>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {claim.description}
                </p>
              </div>
            </div>

            {/* Evidence */}
            {claim.evidence && claim.evidence.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Evidence Provided</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {claim.evidence.map((evidence, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                      {evidence.description && (
                        <p className="text-sm text-gray-700 mb-2">{evidence.description}</p>
                      )}
                      {evidence.url && (
                        <a 
                          href={evidence.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline inline-flex items-center gap-1"
                        >
                          View Evidence
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Arrangements */}
            {claim.meetingArrangements && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Meeting Arrangements</h4>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  {claim.meetingArrangements.proposedDate && (
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Proposed Date:</strong> {new Date(claim.meetingArrangements.proposedDate).toLocaleDateString()}
                    </p>
                  )}
                  {claim.meetingArrangements.proposedLocation && (
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Proposed Location:</strong> {claim.meetingArrangements.proposedLocation}
                    </p>
                  )}
                  {claim.meetingArrangements.notes && (
                    <p className="text-sm text-blue-800">
                      <strong>Notes:</strong> {claim.meetingArrangements.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Messages Preview */}
            {claim.messages && claim.messages.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Recent Messages ({claim.messages.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {claim.messages.slice(-3).map((message, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm text-gray-700">
                          {message.sender?.fullName || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{message.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Analysis */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdInfo className="h-5 w-5 text-blue-600" />
                Confidence Analysis
              </h4>
              <div className={`p-4 rounded-lg border-2 ${
                confidence.color === 'green' ? 'bg-green-50 border-green-200' :
                confidence.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                confidence.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{confidence.label}</span>
                  <span className="text-lg font-bold">{(confidence.score * 100).toFixed(0)}%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {confidence.factors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Flags */}
            {claim.flags && (claim.flags.isUrgent || claim.flags.requiresAdminAttention || claim.flags.isDisputed) && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">System Flags</h4>
                <div className="flex flex-wrap gap-2">
                  {claim.flags.isUrgent && (
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      ⚠️ Urgent
                    </span>
                  )}
                  {claim.flags.requiresAdminAttention && (
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      🔧 Needs Admin Attention
                    </span>
                  )}
                  {claim.flags.isDisputed && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      ⚖️ Disputed
                    </span>
                  )}
                </div>
              </div>
            )}

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
                    onClick={() => onStatusUpdate(claim._id, 'approved')}
                    disabled={updatingClaim === claim._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                    onClick={() => onStatusUpdate(claim._id, 'rejected')}
                    disabled={updatingClaim === claim._id || !statusUpdateNotes.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                    onClick={() => onStatusUpdate(claim._id, 'under_review')}
                    disabled={updatingClaim === claim._id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

                  <button
                    onClick={() => startChatWithClaimant(claim)}
                    className="px-6 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <MdChat className="h-5 w-5" />
                    Chat
                  </button>
                </div>
              </div>
            )}

            {/* Resolved Claim Info */}
            {claim.status !== 'pending' && (
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Resolution Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Status:</strong> <span className={getStatusColor(claim.status).replace('bg-', 'text-')}>
                      {formatStatusText(claim.status)}
                    </span>
                  </p>
                  {claim.ownerMessage && (
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Owner Notes:</strong> {claim.ownerMessage}
                    </p>
                  )}
                  {claim.resolvedAt && (
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Resolved:</strong> {new Date(claim.resolvedAt).toLocaleDateString()}
                    </p>
                  )}
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
                const confidence = getConfidenceLevel(claim);
                
                return (
                  <div key={claim._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      {/* Claim Header */}
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
                              {claim.claimedBy?.fullName || 'Anonymous User'}
                              {claim.claimedBy?.verified && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Verified
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {new Date(claim.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
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
                            {confidence.label} ({(confidence.score * 100).toFixed(0)}%)
                          </div>

                          {/* Quick Actions */}
                          <button
                            onClick={() => startChatWithClaimant(claim)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                            title="Start Chat"
                          >
                            <MdChat className="h-5 w-5" />
                          </button>
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
                          {claim.description}
                        </p>
                        <p className="text-sm text-purple-600 mt-2">Click to view full details and take action</p>
                      </div>

                      {/* Additional Info */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        {claim.evidence && claim.evidence.length > 0 && (
                          <span>📎 {claim.evidence.length} evidence files</span>
                        )}
                        {claim.messages && claim.messages.length > 0 && (
                          <span>💬 {claim.messages.length} messages</span>
                        )}
                        {claim.flags?.isUrgent && (
                          <span className="text-red-600 font-semibold">⚠️ Urgent</span>
                        )}
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

        {/* Under Review Claims Section */}
        {underReviewClaims.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <MdAccessTime className="h-6 w-6 text-blue-600" />
              Under Review ({underReviewClaims.length})
            </h2>
            <div className="grid gap-4">
              {underReviewClaims.map((claim) => {
                const confidence = getConfidenceLevel(claim);
                return (
                  <div 
                    key={claim._id} 
                    className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <MdPerson className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {claim.claimedBy?.fullName || 'Anonymous User'}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          confidence.color === 'green' ? 'bg-green-50 text-green-700 border-green-300' :
                          confidence.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                          confidence.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                          'bg-red-50 text-red-700 border-red-300'
                        }`}>
                          {(confidence.score * 100).toFixed(0)}% Confidence
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          {formatStatusText(claim.status)}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mt-3 line-clamp-2">{claim.description}</p>
                    {claim.ownerMessage && (
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>Review Notes:</strong> {claim.ownerMessage}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolved Claims Section */}
        {resolvedClaims.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Resolved Claims</h2>
            <div className="space-y-4">
              {resolvedClaims.map((claim) => {
                const confidence = getConfidenceLevel(claim);
                
                return (
                  <div 
                    key={claim._id} 
                    className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <MdPerson className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {claim.claimedBy?.fullName || 'Anonymous User'}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          confidence.color === 'green' ? 'bg-green-50 text-green-700 border-green-300' :
                          confidence.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                          confidence.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                          'bg-red-50 text-red-700 border-red-300'
                        }`}>
                          {(confidence.score * 100).toFixed(0)}% Confidence
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          {formatStatusText(claim.status)}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mt-3 line-clamp-2">{claim.description}</p>
                    {claim.ownerMessage && (
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>Resolution Notes:</strong> {claim.ownerMessage}
                      </p>
                    )}
                    {claim.resolvedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Resolved on {new Date(claim.resolvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
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
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => navigate(-1)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all"
              >
                Back to Posts
              </button>
              <Link
                to="/search"
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold transition-all"
              >
                Browse Items
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onStatusUpdate={handleUpdateClaimStatus}
        />
      )}
    </div>
  );
};

export default ClaimsManagement;