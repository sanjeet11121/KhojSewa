import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, apiCall } from "../config.js";
import { MdArrowBack, MdCheckCircle, MdCancel, MdMessage, MdPhone, MdEmail, MdLocationOn, MdCalendarToday } from "react-icons/md";
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

  // Fetch post details and claims
  useEffect(() => {
    const fetchPostAndClaims = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Try multiple endpoint variations
        const endpoints = [
          `/api/v1/found-posts/${postId}`,
          `/api/v1/posts/found/${postId}`,
          `/api/v1/found/${postId}`
        ];

        let postResult = null;
        
        // Try each endpoint until one works
        for (const endpoint of endpoints) {
          postResult = await apiCall(endpoint);
          if (postResult.success) break;
        }

        if (!postResult.success) {
          throw new Error(postResult.error || "Post not found");
        }

        setPost(postResult.data);

        // Try to fetch claims
        const claimsResult = await apiCall(`/api/v1/claims/post/${postId}?type=found`);
        if (claimsResult.success) {
          setClaims(claimsResult.data || []);
        }

      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.message || "Failed to load post details");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostAndClaims();
    }
  }, [postId]);

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
          postType: "found",
          message: claimMessage,
        }),
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit claim");
      }

      alert("Claim submitted successfully! The owner will review your claim.");
      setShowClaimForm(false);
      setClaimMessage("");
      
      // Refresh claims list
      const claimsResult = await apiCall(`/api/v1/claims/post/${postId}?type=found`);
      if (claimsResult.success) {
        setClaims(claimsResult.data || []);
      }

    } catch (err) {
      alert(err.message || "Failed to submit claim");
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Handle claim status update (for post owner)
  const handleUpdateClaimStatus = async (claimId, status) => {
    try {
      const result = await apiCall(`/api/v1/claims/${claimId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update claim status");
      }

      // Refresh claims list
      const claimsResult = await apiCall(`/api/v1/claims/post/${postId}?type=found`);
      if (claimsResult.success) {
        setClaims(claimsResult.data || []);
      }

      alert(`Claim ${status} successfully`);

    } catch (err) {
      alert(err.message || "Failed to update claim status");
    }
  };

  // Check if current user is the post owner
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isPostOwner = post?.user?._id === currentUser._id;

  // Check if user has an approved claim
  const userApprovedClaim = claims.find(
    claim => claim.user?._id === currentUser._id && claim.status === "approved"
  );

  // Get images
  const images = post?.images?.filter(Boolean) || [];

  // Mock data for development (remove in production)
  const mockPost = {
    _id: postId,
    title: "Found: Black iPhone 13 Pro",
    description: "Found a black iPhone 13 Pro near Central Park. Has a black case and screen protector.",
    category: "electronics",
    locationFound: "Central Park, Kathmandu",
    foundDate: new Date().toISOString(),
    itemName: "iPhone 13 Pro",
    itemCondition: "Good",
    images: [],
    user: {
      _id: "user123",
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+977 9841000000"
    },
    isReturned: false
  };

  const mockClaims = [];

  // Use mock data if API fails (for development)
  const displayPost = post || mockPost;
  const displayClaims = claims.length > 0 ? claims : mockClaims;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200">
      <Navbar />
      <div className="pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <div className="text-xl text-purple-700">Loading post details...</div>
        </div>
      </div>
    </div>
  );

  if (error && !post) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200">
      <Navbar />
      <div className="pt-20 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h2>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-gray-500 text-sm mb-6">
            The post may have been deleted or the API endpoint is not available.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200">
      <Navbar />
      
      {/* Development Warning Banner */}
      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4">
          <div className="max-w-6xl mx-auto text-yellow-700 text-sm">
            ⚠️ Using demo data: {error}
          </div>
        </div>
      )}
      
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
              displayPost.isReturned 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
            }`}>
              {displayPost.isReturned ? '✅ Item Returned' : '📦 Item Found'}
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
                        alt={`${displayPost.itemName || displayPost.title} - ${idx + 1}`}
                        className="w-full h-64 object-cover rounded-xl border shadow group-hover:shadow-lg transition-all duration-300"
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
                    {displayPost.itemName || displayPost.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                      {displayPost.category || "Uncategorized"}
                    </span>
                    {displayPost.itemCondition && (
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                        Condition: {displayPost.itemCondition}
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
                  <button
                    onClick={() => setActiveTab("claims")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "claims"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Claims ({displayClaims.length})
                  </button>
                  {(isPostOwner || userApprovedClaim) && (
                    <button
                      onClick={() => setActiveTab("contact")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "contact"
                          ? "border-purple-500 text-purple-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Contact Information
                    </button>
                  )}
                </nav>
              </div>

              {/* Tab Content - Rest of your existing tab content */}
              {/* ... (keep the existing tab content from previous implementation) */}
              
            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal - Keep your existing modal code */}
      {/* ... */}
    </div>
  );
}