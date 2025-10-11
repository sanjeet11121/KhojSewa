import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  MdThumbDown
} from 'react-icons/md';

const ClaimsManagement = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingClaim, setUpdatingClaim] = useState(null);

useEffect(() => {
  const fetchClaimsAndPost = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Fetch post details - using the posts endpoint
      const postRes = await fetch(`${api}/api/v1/posts/found/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (postRes.ok) {
        const postData = await postRes.json();
        setPost(postData.data);
      } else {
        const errorData = await postRes.json();
        throw new Error(errorData.message || 'Failed to fetch post details');
      }

      // Fetch claims for this post - using the new claims endpoint
      const claimsRes = await fetch(`${api}/api/v1/claims/post/${postId}?type=found`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const claimsData = await claimsRes.json();
      
      if (!claimsRes.ok) {
        throw new Error(claimsData.message || 'Failed to fetch claims');
      }

      setClaims(claimsData.data || []);
      
    } catch (err) {
      setError(err.message || 'Failed to load claims');
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchClaimsAndPost();
}, [postId]);

  const handleUpdateClaimStatus = async (claimId, status) => {
    setUpdatingClaim(claimId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${api}/api/v1/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update claim status');
      }

      // Update local state
      setClaims(prev => prev.map(claim => 
        claim._id === claimId ? { ...claim, status } : claim
      ));

      // Show success message
      alert(`Claim ${status} successfully!`);

    } catch (err) {
      alert(err.message || 'Failed to update claim status');
      console.error('Error updating claim:', err);
    } finally {
      setUpdatingClaim(null);
    }
  };

  const getConfidenceLevel = (claim) => {
    // Calculate confidence based on various factors
    let score = 0;
    let factors = [];

    // Text similarity (mock calculation - replace with actual ML score)
    if (claim.message && claim.message.length > 50) score += 0.3;
    if (claim.message && claim.message.toLowerCase().includes('serial')) score += 0.2;
    
    // Date proximity (mock)
    if (post && claim.createdAt) {
      const postDate = new Date(post.foundDate);
      const claimDate = new Date(claim.createdAt);
      const daysDiff = Math.abs((claimDate - postDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 3) score += 0.3;
      else if (daysDiff <= 7) score += 0.2;
      else score += 0.1;
    }

    // User credibility (mock)
    if (claim.user?.verified) score += 0.2;

    // Determine confidence level
    if (score >= 0.7) return { level: 'high', score, color: 'green', label: 'High Confidence' };
    if (score >= 0.4) return { level: 'medium', score, color: 'yellow', label: 'Medium Confidence' };
    return { level: 'low', score, color: 'red', label: 'Low Confidence' };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <MdCheckCircle className="h-5 w-5" />;
      case 'rejected': return <MdCancel className="h-5 w-5" />;
      default: return <MdSchedule className="h-5 w-5" />;
    }
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
  const resolvedClaims = claims.filter(claim => claim.status !== 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-8 px-4 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-purple-700 hover:text-purple-800 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border hover:shadow-md transition-all"
          >
            <MdArrowBack className="h-5 w-5" />
            Back to My Posts
          </button>
          
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-900">All Claims </h1>
            {post && (
              <p className="text-gray-600 mt-1">
                For: <span className="font-semibold">{post.title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-gray-900">{claims.length}</div>
            <div className="text-gray-600">Total Claims</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingClaims.length}</div>
            <div className="text-gray-600">Pending</div>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <MdSchedule className="h-6 w-6 text-yellow-600" />
            Pending Claims ({pendingClaims.length})
          </h2>

          {pendingClaims.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Claims</h3>
              <p className="text-gray-600">There are no pending claims for this post yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingClaims.map((claim) => {
                const confidence = getConfidenceLevel(claim);
                
                return (
                  <div key={claim._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      {/* Claim Header */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <MdPerson className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {claim.user?.fullName || 'Anonymous User'}
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
                        
                        {/* Confidence Badge */}
                        <div className={`px-4 py-2 rounded-full border font-semibold ${
                          confidence.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                          confidence.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {confidence.label} ({(confidence.score * 100).toFixed(0)}%)
                        </div>
                      </div>

                      {/* Claim Message */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <MdMessage className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-800">Claim Description</h4>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {claim.message}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleUpdateClaimStatus(claim._id, 'approved')}
                          disabled={updatingClaim === claim._id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          disabled={updatingClaim === claim._id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      </div>

                      {/* Confidence Factors */}
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h5 className="font-semibold text-blue-800 mb-2">Confidence Factors:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                          <div>✓ Detailed claim description</div>
                          <div>✓ Timely submission</div>
                          <div>✓ User verification status</div>
                          <div>✓ Matching item details</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resolved Claims Section */}
        {resolvedClaims.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Resolved Claims</h2>
            <div className="space-y-4">
              {resolvedClaims.map((claim) => {
                const confidence = getConfidenceLevel(claim);
                
                return (
                  <div key={claim._id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <MdPerson className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {claim.user?.fullName || 'Anonymous User'}
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
                          'bg-red-50 text-red-700 border-red-300'
                        }`}>
                          {(confidence.score * 100).toFixed(0)}% Confidence
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mt-3 line-clamp-2">{claim.message}</p>
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
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all"
              >
                Back to Posts
              </button>
              <button
                onClick={() => navigate('/search')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold transition-all"
              >
                Browse Items
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimsManagement;