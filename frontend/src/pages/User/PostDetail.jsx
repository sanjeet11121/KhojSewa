import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, apiCall } from "../config.js";
import { 
  MdArrowBack, 
  MdCheckCircle, 
  MdCancel, 
  MdMessage, 
  MdPhone, 
  MdEmail, 
  MdLocationOn, 
  MdCalendarToday,
  MdPerson,
  MdWarning,
  MdInfo,
  MdThumbUp,
  MdThumbDown,
  MdAccessTime
} from "react-icons/md";
import Navbar from "./Navbar";

export default function FoundPostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claims, setClaims] = useState([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusUpdateNotes, setStatusUpdateNotes] = useState("");

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Fetch post details
  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        setError("");
        
        const result = await apiCall(`/api/v1/posts/found/${postId}`);
        
        if (!result.success) {
          throw new Error(result.error || "Failed to load post");
        }

        setPost(result.data);
        
        // If user is post owner, fetch claims
        if (result.data.user?._id === currentUser._id) {
          await fetchClaims();
        }

      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.message || "Failed to load post details");
      } finally {
        setLoading(false);
      }
    };

    const fetchClaims = async () => {
      try {
        const result = await apiCall(`/api/v1/claims/post/${postId}?type=found`);
        if (result.success) {
          setClaims(result.data || []);
        }
      } catch (err) {
        console.error("Error fetching claims:", err);
      }
    };

    if (postId) {
      fetchPostDetails();
    }
  }, [postId, currentUser._id]);

  // Handle claim submission
  const handleSubmitClaim = async () => {
    if (!claimMessage.trim()) {
      alert("Please enter a claim message");
      return;
    }

    setSubmittingClaim(true);
    try {
      const result = await apiCall('/api/v1/claims', {
        method: "POST",
        body: JSON.stringify({
          postId,
          postType: "FoundPost",
          claimMessage: claimMessage.trim(),
          contactInfo: {
            email: currentUser.email,
            phone: currentUser.phoneNumber,
            preferredContact: "email"
          }
        }),
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit claim");
      }

      alert("Claim submitted successfully! The owner will review your claim.");
      setShowClaimForm(false);
      setClaimMessage("");
      
      // Refresh claims if user is post owner
      if (post?.user?._id === currentUser._id) {
        const claimsResult = await apiCall(`/api/v1/claims/post/${postId}?type=found`);
        if (claimsResult.success) {
          setClaims(claimsResult.data || []);
        }
      }

    } catch (err) {
      alert(err.message || "Failed to submit claim");
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Handle claim status update
  const handleUpdateClaimStatus = async (claimId, status) => {
    if (status === 'rejected' && !statusUpdateNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const result = await apiCall(`/api/v1/claims/${claimId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ 
          status, 
          notes: statusUpdateNotes 
        }),
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update claim status");
      }

      // Update local state
      setClaims(prev => prev.map(claim => 
        claim._id === claimId ? { 
          ...claim, 
          status, 
          resolution: {
            notes: statusUpdateNotes,
            resolvedBy: currentUser._id,
            resolvedAt: new Date().toISOString()
          }
        } : claim
      ));

      setStatusUpdateNotes('');
      setSelectedClaim(null);
      alert(`Claim ${status} successfully`);

    } catch (err) {
      alert(err.message || "Failed to update claim status");
    }
  };

  // Check if current user is the post owner
  const isPostOwner = post?.user?._id === currentUser._id;

  // Check if user has already claimed this post
  const userHasClaimed = claims.some(claim => 
    claim.claimant?._id === currentUser._id && claim.status === 'pending'
  );

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <MdCheckCircle className="h-4 w-4" />;
      case 'rejected': return <MdCancel className="h-4 w-4" />;
      case 'under_review': return <MdAccessTime className="h-4 w-4" />;
      default: return <MdAccessTime className="h-4 w-4" />;
    }
  };

  // Format status text
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Calculate claim confidence score
  const calculateClaimScore = (claim) => {
    let score = 0;
    
    // Message length (max 30 points)
    if (claim.claimMessage.length > 100) score += 30;
    else if (claim.claimMessage.length > 50) score += 20;
    else if (claim.claimMessage.length > 20) score += 10;
    
    // Contact info (20 points)
    if (claim.contactInfo?.phone || claim.contactInfo?.email) score += 20;
    
    // Evidence (30 points)
    if (claim.evidence && claim.evidence.length > 0) score += 30;
    
    // User verification (20 points)
    if (claim.claimant?.verified) score += 20;
    
    return Math.min(score, 100);
  };

  // Claim Detail Modal
  const ClaimDetailModal = ({ claim, onClose, onStatusUpdate }) => {
    const confidenceScore = calculateClaimScore(claim);
    
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
                  <p className="font-medium">{claim.claimant?.fullName || 'Unknown User'}</p>
                  <p className="text-sm text-gray-600">{claim.claimant?.email}</p>
                  {claim.claimant?.verified && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-1">
                      ✓ Verified User
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

            {/* Confidence Score */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdInfo className="h-5 w-5 text-blue-600" />
                Claim Confidence Score
              </h4>
              <div className={`p-4 rounded-lg border-2 ${
                confidenceScore >= 70 ? 'bg-green-50 border-green-200' :
                confidenceScore >= 40 ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {confidenceScore >= 70 ? 'High Confidence' :
                     confidenceScore >= 40 ? 'Medium Confidence' : 'Low Confidence'}
                  </span>
                  <span className="text-lg font-bold">{confidenceScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      confidenceScore >= 70 ? 'bg-green-500' :
                      confidenceScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Buttons for Post Owner */}
            {claim.status === 'pending' && isPostOwner && (
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <MdThumbUp className="h-5 w-5" />
                    Approve Claim
                  </button>
                  
                  <button
                    onClick={() => onStatusUpdate(claim._id, 'rejected')}
                    disabled={!statusUpdateNotes.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <MdThumbDown className="h-5 w-5" />
                    Reject Claim
                  </button>

                  <button
                    onClick={() => onStatusUpdate(claim._id, 'under_review')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <MdAccessTime className="h-5 w-5" />
                    Under Review
                  </button>
                </div>
              </div>
            )}

            {/* Resolution Details */}
            {claim.status !== 'pending' && claim.resolution && (
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Resolution Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Status:</strong> <span className={getStatusColor(claim.status).replace('bg-', 'text-')}>
                      {formatStatus(claim.status)}
                    </span>
                  </p>
                  {claim.resolution.notes && (
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Notes:</strong> {claim.resolution.notes}
                    </p>
                  )}
                  {claim.resolution.resolvedAt && (
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Resolved:</strong> {new Date(claim.resolution.resolvedAt).toLocaleDateString()}
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

  // Claim Form Modal
  const ClaimFormModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Claim This Item
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why do you believe this is your item? *
            </label>
            <textarea
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
              placeholder="Describe specific details that prove this item belongs to you. Include identifying marks, when you lost it, unique features, etc."
              className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <MdInfo className="h-4 w-4" />
              Contact Information
            </h4>
            <p className="text-blue-700 text-sm">
              Your contact information (email: {currentUser.email}) will be shared with the post owner if your claim is approved.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowClaimForm(false)}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitClaim}
              disabled={submittingClaim || !claimMessage.trim()}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submittingClaim ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-purple-700 font-medium">Loading post details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h2>
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

  const images = post?.images?.filter(Boolean) || [];
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
            Back to Posts
          </button>
          
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              post?.isReturned 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
            }`}>
              {post?.isReturned ? '✅ Item Returned' : '📦 Item Found'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Item Images</h3>
              
              {images.length > 0 ? (
                <div className="space-y-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`${post?.itemName || post?.title} - ${idx + 1}`}
                        className="w-full h-64 object-cover rounded-xl border shadow group-hover:shadow-lg transition-all duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                  <div className="text-4xl mb-2">📷</div>
                  <p>No images available</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details and Claims */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {post?.itemName || post?.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                      {post?.category || "Uncategorized"}
                    </span>
                    {post?.itemCondition && (
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                        Condition: {post.itemCondition}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "details"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Item Details
                  </button>
                  {isPostOwner && (
                    <button
                      onClick={() => setActiveTab("claims")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "claims"
                          ? "border-purple-500 text-purple-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Claims ({claims.length})
                      {pendingClaims.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                          {pendingClaims.length}
                        </span>
                      )}
                    </button>
                  )}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4 border">
                      {post?.description || "No description provided."}
                    </p>
                  </div>

                  {/* Location & Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <MdLocationOn className="h-5 w-5 text-purple-600" />
                        Found Location
                      </h3>
                      <p className="text-gray-700 bg-gray-50 rounded-lg p-4 border">
                        {post?.locationFound || "Location not specified"}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <MdCalendarToday className="h-5 w-5 text-purple-600" />
                        Found Date
                      </h3>
                      <p className="text-gray-700 bg-gray-50 rounded-lg p-4 border">
                        {post?.foundDate ? new Date(post.foundDate).toLocaleDateString() : "Date not specified"}
                      </p>
                    </div>
                  </div>

                  {/* Contact Information for Post Owner */}
                  {isPostOwner && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Your Contact Information</h3>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-blue-800">
                          This information will be shared with claimants when their claim is approved.
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-blue-700">
                          <p className="flex items-center gap-2">
                            <MdEmail className="h-4 w-4" />
                            {currentUser.email}
                          </p>
                          {currentUser.phoneNumber && (
                            <p className="flex items-center gap-2">
                              <MdPhone className="h-4 w-4" />
                              {currentUser.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Claim Button for Non-Owners */}
                  {!isPostOwner && !userHasClaimed && !post?.isReturned && (
                    <div className="border-t pt-6">
                      <button
                        onClick={() => setShowClaimForm(true)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                      >
                        Claim This Item
                      </button>
                      <p className="text-center text-gray-600 mt-3 text-sm">
                        Think this is your lost item? Submit a claim with details to prove ownership.
                      </p>
                    </div>
                  )}

                  {/* Status Messages */}
                  {userHasClaimed && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <MdWarning className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-semibold text-yellow-800">Claim Pending</p>
                          <p className="text-yellow-700 text-sm">
                            You have already submitted a claim for this item. The owner will review it soon.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {post?.isReturned && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <MdCheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-800">Item Returned</p>
                          <p className="text-green-700 text-sm">
                            This item has been successfully returned to its owner.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Claims Tab */}
              {activeTab === "claims" && isPostOwner && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{claims.length}</div>
                      <div className="text-gray-600 text-sm">Total Claims</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{pendingClaims.length}</div>
                      <div className="text-gray-600 text-sm">Pending</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {claims.filter(c => c.status === 'approved').length}
                      </div>
                      <div className="text-gray-600 text-sm">Approved</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {claims.filter(c => c.status === 'rejected').length}
                      </div>
                      <div className="text-gray-600 text-sm">Rejected</div>
                    </div>
                  </div>

                  {/* Pending Claims */}
                  {pendingClaims.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <MdWarning className="h-5 w-5 text-yellow-600" />
                        Pending Claims ({pendingClaims.length})
                      </h3>
                      <div className="space-y-4">
                        {pendingClaims.map((claim) => {
                          const score = calculateClaimScore(claim);
                          return (
                            <div 
                              key={claim._id} 
                              className="bg-white border-2 border-yellow-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setSelectedClaim(claim)}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <MdPerson className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">
                                      {claim.claimant?.fullName || 'Anonymous User'}
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                      {new Date(claim.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                                    {getStatusIcon(claim.status)}
                                    {formatStatus(claim.status)}
                                  </div>
                                  <div className={`text-xs mt-1 ${
                                    score >= 70 ? 'text-green-600' :
                                    score >= 40 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {score}% Confidence
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-600 line-clamp-2">{claim.claimMessage}</p>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClaim(claim);
                                }}
                                className="text-purple-600 hover:text-purple-700 font-medium text-sm mt-2"
                              >
                                Review Claim →
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Resolved Claims */}
                  {resolvedClaims.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4">Resolved Claims</h3>
                      <div className="space-y-3">
                        {resolvedClaims.map((claim) => (
                          <div 
                            key={claim._id} 
                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => setSelectedClaim(claim)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <MdPerson className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {claim.claimant?.fullName || 'Anonymous User'}
                                  </p>
                                  <p className="text-gray-500 text-sm">
                                    {new Date(claim.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                                {getStatusIcon(claim.status)}
                                {formatStatus(claim.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Claims Message */}
                  {claims.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📭</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Claims Yet</h3>
                      <p className="text-gray-600">
                        No one has claimed this item yet. When someone submits a claim, it will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showClaimForm && <ClaimFormModal />}
      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onStatusUpdate={handleUpdateClaimStatus}
        />
      )}
    </div>
  );
}