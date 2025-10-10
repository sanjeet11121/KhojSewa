import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../config.js";
import { MdArrowBack, MdCheckCircle, MdCancel, MdMessage, MdPhone, MdEmail, MdLocationOn, MdCalendarToday } from "react-icons/md";
import Navbar from "../../components/Navbar.jsx";

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
        const token = localStorage.getItem("accessToken");
        
        // Fetch post details
        const postRes = await fetch(`${api}/api/v1/found-posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const postData = await postRes.json();
        
        if (!postRes.ok) {
          throw new Error(postData.message || "Failed to fetch post");
        }
        
        setPost(postData.data);

        // Fetch claims for this post
        const claimsRes = await fetch(`${api}/api/v1/claims/post/${postId}?type=found`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const claimsData = await claimsRes.json();
        
        if (claimsRes.ok) {
          setClaims(claimsData.data || []);
        }

      } catch (err) {
        setError(err.message || "Network error");
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
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${api}/api/v1/claims`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          postType: "found",
          message: claimMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit claim");
      }

      alert("Claim submitted successfully! The owner will review your claim.");
      setShowClaimForm(false);
      setClaimMessage("");
      
      // Refresh claims list
      const claimsRes = await fetch(`${api}/api/v1/claims/post/${postId}?type=found`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const claimsData = await claimsRes.json();
      if (claimsRes.ok) {
        setClaims(claimsData.data || []);
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
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${api}/api/v1/claims/${claimId}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update claim status");
      }

      // Refresh claims list
      const claimsRes = await fetch(`${api}/api/v1/claims/post/${postId}?type=found`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const claimsData = await claimsRes.json();
      if (claimsRes.ok) {
        setClaims(claimsData.data || []);
      }

      alert(`Claim ${status} successfully`);

    } catch (err) {
      alert(err.message || "Failed to update claim status");
    }
  };

  // Check if current user is the post owner
  const isPostOwner = post?.user?._id === JSON.parse(localStorage.getItem("user"))?._id;

  // Check if user has an approved claim
  const userApprovedClaim = claims.find(
    claim => claim.user?._id === JSON.parse(localStorage.getItem("user"))?._id && claim.status === "approved"
  );

  // Get images
  const images = post?.images?.filter(Boolean) || [];

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200">
      <Navbar />
      <div className="pt-20 flex items-center justify-center">
        <div className="text-xl text-purple-700 animate-pulse">Loading post details...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200">
      <Navbar />
      <div className="pt-20 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200">
      <Navbar />
      <div className="pt-20 flex items-center justify-center">
        <div className="text-xl text-gray-500">Post not found.</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200">
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
              post.isReturned 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
            }`}>
              {post.isReturned ? '✅ Item Returned' : '📦 Item Found'}
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
                        alt={`${post.itemName || post.title} - ${idx + 1}`}
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
                    {post.itemName || post.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                      {post.category || "Uncategorized"}
                    </span>
                    {post.itemCondition && (
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
                  <button
                    onClick={() => setActiveTab("claims")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "claims"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Claims ({claims.length})
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

              {/* Tab Content */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {post.description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-700">
                        <MdLocationOn className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-semibold">Location Found</div>
                          <div>{post.locationFound || "Not specified"}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-700">
                        <MdCalendarToday className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-semibold">Date Found</div>
                          <div>
                            {post.foundDate 
                              ? new Date(post.foundDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : "Not specified"
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">
                            {post.user?.fullName?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">Posted by</div>
                          <div className="text-gray-700">
                            {post.user?.fullName || "Anonymous User"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Claim Button for non-owners */}
                  {!isPostOwner && !post.isReturned && (
                    <div className="pt-6 border-t">
                      <button
                        onClick={() => setShowClaimForm(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        🎯 Claim This Item
                      </button>
                      <p className="text-sm text-gray-600 mt-2">
                        Think this is your item? Submit a claim with details to get it back.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "claims" && (
                <div className="space-y-4">
                  {isPostOwner ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Manage Claims ({claims.length})
                      </h3>
                      
                      {claims.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">📝</div>
                          <p>No claims submitted yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {claims.map((claim) => (
                            <div key={claim._id} className="border rounded-xl p-4 bg-gray-50">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-semibold">
                                      {claim.user?.fullName?.charAt(0) || "U"}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-800">
                                      {claim.user?.fullName || "Anonymous"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {new Date(claim.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  claim.status === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : claim.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {claim.status}
                                </span>
                              </div>
                              
                              <p className="text-gray-700 mb-4">{claim.message}</p>
                              
                              {claim.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateClaimStatus(claim._id, 'approved')}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                  >
                                    <MdCheckCircle className="h-4 w-4" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateClaimStatus(claim._id, 'rejected')}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                  >
                                    <MdCancel className="h-4 w-4" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    // For non-owners, show their claims
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Claims</h3>
                      {claims.filter(claim => claim.user?._id === JSON.parse(localStorage.getItem("user"))?._id).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>You haven't submitted any claims for this item yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {claims.filter(claim => claim.user?._id === JSON.parse(localStorage.getItem("user"))?._id).map((claim) => (
                            <div key={claim._id} className="border rounded-xl p-4 bg-gray-50">
                              <div className="flex justify-between items-center mb-3">
                                <div className="font-semibold">Your Claim</div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  claim.status === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : claim.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {claim.status}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{claim.message}</p>
                              <div className="text-sm text-gray-500">
                                Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                              </div>
                              
                              {claim.status === 'approved' && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                                    <MdCheckCircle className="h-5 w-5" />
                                    Claim Approved!
                                  </div>
                                  <p className="text-green-600 text-sm">
                                    Your claim has been approved! You can now contact the finder to arrange item return.
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Information Tab - Only visible to post owner or approved claimants */}
              {activeTab === "contact" && (isPostOwner || userApprovedClaim) && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                  
                  {isPostOwner ? (
                    <div className="space-y-4">
                      <p className="text-gray-700">
                        This is your post. Here's the contact information that approved claimants can see:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 text-gray-700">
                          <MdPhone className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-semibold">Phone</div>
                            <div>{post.user?.phone || "Not provided"}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-gray-700">
                          <MdEmail className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-semibold">Email</div>
                            <div>{post.user?.email || "Not provided"}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-yellow-700 text-sm">
                          <strong>Note:</strong> Approved claimants can see your contact information to arrange item return.
                        </p>
                      </div>
                    </div>
                  ) : userApprovedClaim && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                          <MdCheckCircle className="h-5 w-5" />
                          Your Claim Has Been Approved!
                        </div>
                        <p className="text-green-600">
                          You can now contact the person who found your item to arrange its return.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white border rounded-xl shadow-sm">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-purple-600 font-semibold text-xl">
                              {post.user?.fullName?.charAt(0) || "U"}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-800">{post.user?.fullName || "Anonymous"}</h4>
                          <p className="text-gray-600 text-sm">Item Finder</p>
                        </div>

                        <div className="space-y-4">
                          {post.user?.phone && (
                            <div className="flex items-center gap-3">
                              <MdPhone className="h-5 w-5 text-purple-600" />
                              <div>
                                <div className="font-semibold text-gray-800">Phone</div>
                                <a 
                                  href={`tel:${post.user.phone}`}
                                  className="text-purple-600 hover:text-purple-700"
                                >
                                  {post.user.phone}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {post.user?.email && (
                            <div className="flex items-center gap-3">
                              <MdEmail className="h-5 w-5 text-purple-600" />
                              <div>
                                <div className="font-semibold text-gray-800">Email</div>
                                <a 
                                  href={`mailto:${post.user.email}`}
                                  className="text-purple-600 hover:text-purple-700"
                                >
                                  {post.user.email}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all">
                            <MdMessage className="h-5 w-5" />
                            Send Message
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Claim This Item</h3>
            <p className="text-gray-600 mb-4">
              Please describe why you believe this is your item. Include details like:
            </p>
            <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
              <li>Identifying marks or features</li>
              <li>When and where you lost it</li>
              <li>Any unique characteristics</li>
            </ul>
            
            <textarea
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
              placeholder="Describe your item in detail..."
              className="w-full h-40 p-3 border border-gray-300 rounded-lg mb-4 resize-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleSubmitClaim}
                disabled={!claimMessage.trim() || submittingClaim}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submittingClaim ? "Submitting..." : "Submit Claim"}
              </button>
              <button
                onClick={() => setShowClaimForm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}