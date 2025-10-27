import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRecommendations, fetchFoundPostRecommendations } from '../../utils/recommendationApi';
import Navbar from '../../components/Navbar';
import { claimApi } from '../../utils/claimApi';

const Recommendations = () => {
  const { postId, postType } = useParams();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [postDetails, setPostDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [claimingPostId, setClaimingPostId] = useState(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [currentRecommendation, setCurrentRecommendation] = useState(null);

  useEffect(() => {
    async function getRecommendations() {
      setLoading(true);
      setError("");
      
      try {
        let result;
        if (postType === 'found') {
          result = await fetchFoundPostRecommendations(postId);
        } else {
          result = await fetchRecommendations(postId);
        }

        if (result.error) {
          if (result.error.includes('Cannot connect to the server')) {
            setError(`
              Backend server is not running. 
              Please make sure the server is started on port 5000.
              ${result.error}
            `);
          } else {
            setError(result.error);
          }
        } else {
          setRecommendations(result.recommendations || []);
          // Set post details if available in response
          if (result.queryPost) {
            setPostDetails(result.queryPost);
          }
        }
      } catch (err) {
        setError("Unexpected error occurred while fetching recommendations");
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (postId) {
      getRecommendations();
    }
  }, [postId, postType]);

  // Update the Claim Item button click handler
  const handleClaimButtonClick = (postId, recommendation, e) => {
    e.stopPropagation();
    console.log('Setting recommendation for claim:', recommendation);
    setCurrentRecommendation(recommendation);
    setClaimingPostId(postId);
  };

  const handlePostClick = (post) => {
    if (post.type === 'lost') {
      navigate(`/lost-posts/${post.id}`);
    } else {
      navigate(`/found-posts/${post.id}`);
    }
  };

  // Update handleClaimItem to use the stored recommendation
  const handleClaimItem = async () => {
    if (!currentRecommendation || !claimMessage.trim()) {
      alert('Please enter a claim message');
      return;
    }

    const postId = claimingPostId;
    const recommendation = currentRecommendation;
    
    try {
      console.log('=== CLAIM CREATION ===');
      console.log('Current recommendation:', recommendation);
      console.log('ML Data:', {
        confidence: recommendation.confidence,
        score: recommendation.score,
        breakdown: recommendation.breakdown
      });
      
      const claimType = 'LostPost';
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const claimData = {
        postId: postId,
        postType: claimType,
        claimMessage: claimMessage.trim(),
        contactInfo: {
          email: userData.email || '',
          phone: userData.phoneNumber || '',
          preferredContact: 'email'
        }
      };

      // Only add matchingData if we have the recommendation data
      if (recommendation && recommendation.confidence) {
        claimData.matchingData = {
          confidence: recommendation.confidence,
          score: recommendation.score || 0.7, // Default score if not provided
          breakdown: recommendation.breakdown || {
            text: 0.7,
            category: 0.7,
            location: 0.7,
            date: 0.7
          }
        };
        console.log('Added matchingData:', claimData.matchingData);
      }
      
      console.log('Final claim data:', claimData);
      
      const result = await claimApi.createClaim(claimData);
      
      console.log('Claim creation response:', result);
      
      if (result.success) {
        alert('🎉 Claim submitted successfully!');
        setClaimMessage("");
        setCurrentRecommendation(null);
        
        // Update the recommendation to show it's claimed
        setRecommendations(prev => prev.map(rec => 
          rec.post.id === postId 
            ? { ...rec, post: { ...rec.post, hasClaimed: true } }
            : rec
        ));
      } else {
        alert(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Claim submission error:', error);
      alert('Error submitting claim: ' + error.message);
    } finally {
      setClaimingPostId(null);
      setCurrentRecommendation(null);
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (activeTab === 'all') return true;
    if (activeTab === 'high') return rec.confidence === 'high';
    if (activeTab === 'medium') return rec.confidence === 'medium';
    if (activeTab === 'low') return rec.confidence === 'low';
    return true;
  });

  const confidenceStats = {
    high: recommendations.filter(r => r.confidence === 'high').length,
    medium: recommendations.filter(r => r.confidence === 'medium').length,
    low: recommendations.filter(r => r.confidence === 'low').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto py-8 px-4 pt-24">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-purple-700 mb-2">
            KhojSewa System Engine Results
          </h2>
          <p className="text-gray-600 mb-4">
            Smart matches found using our system 
          </p>
          
          {postDetails && (
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-800 mb-2">Original Post:</h3>
              <p className="text-gray-700">{postDetails.title}</p>
              {postDetails.category && (
                <span className="inline-block bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded mt-2">
                  {postDetails.category}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Claim Message Modal */}
        {currentRecommendation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">Claiming This Item:</h4>
            <p className="text-blue-700 font-medium">{currentRecommendation.post.title}</p>
            <p className="text-blue-600 text-sm">Confidence: {currentRecommendation.confidence}</p>
            <p className="text-blue-600 text-sm">Match Score: {Math.round((currentRecommendation.score || 0.7) * 100)}%</p>
          </div>
        )}

        {/* FIXED: Modal with improved background */}
        {claimingPostId && (
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl border border-gray-200">
              <h3 className="text-xl font-bold text-purple-700 mb-4">Submit Claim</h3>
              <p className="text-gray-600 mb-4">
                Describe why you believe this item belongs to you. Include specific details that can help verify your claim.
              </p>
              <textarea
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
                placeholder="Provide details like: identifying marks, when you lost it, unique features, serial numbers, etc."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg mb-4 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleClaimItem}
                  disabled={!claimMessage.trim() || !currentRecommendation}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  Submit Claim
                </button>
                <button
                  onClick={() => {
                    setClaimingPostId(null);
                    setCurrentRecommendation(null);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confidence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-all">
            <div className="text-3xl font-bold text-green-700">{confidenceStats.high}</div>
            <div className="text-green-600 font-medium">High Confidence</div>
            <p className="text-green-500 text-sm mt-1">Excellent matches</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-all">
            <div className="text-3xl font-bold text-yellow-700">{confidenceStats.medium}</div>
            <div className="text-yellow-600 font-medium">Medium Confidence</div>
            <p className="text-yellow-500 text-sm mt-1">Good potential matches</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-all">
            <div className="text-3xl font-bold text-red-700">{confidenceStats.low}</div>
            <div className="text-red-600 font-medium">Low Confidence</div>
            <p className="text-red-500 text-sm mt-1">Possible matches</p>
          </div>
        </div>

        {/* Filter Tabs - IMPROVED */}
        <div className="flex space-x-2 mb-8 overflow-x-auto bg-white p-2 rounded-xl shadow-sm border">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'all' 
                ? 'bg-purple-600 text-white shadow-lg transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            All Matches ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('high')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'high' 
                ? 'bg-green-600 text-white shadow-lg transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            High Confidence ({confidenceStats.high})
          </button>
          <button
            onClick={() => setActiveTab('medium')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'medium' 
                ? 'bg-yellow-600 text-white shadow-lg transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            Medium Confidence ({confidenceStats.medium})
          </button>
          <button
            onClick={() => setActiveTab('low')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'low' 
                ? 'bg-red-600 text-white shadow-lg transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
            }`}
          >
            Low Confidence ({confidenceStats.low})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-xl text-purple-700 font-medium mb-2">Analyzing posts ..</p>
            <p className="text-gray-600">Using cosine similarity to find the best matches</p>
            <div className="mt-4 text-sm text-gray-500">
              Comparing text, categories, locations, and dates...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <div className="text-red-700 text-xl font-semibold mb-3">Unable to load recommendations</div>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate('/search')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Search Manually
              </button>
            </div>
          </div>
        )}

        {/* No Recommendations */}
        {!loading && !error && filteredRecommendations.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border">
            <div className="text-gray-400 text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-3">No matches found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't find any similar posts matching your criteria. Try adjusting your search or check back later.
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => navigate('/search')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Search Posts
              </button>
              <button 
                onClick={() => navigate(-1)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        {!loading && !error && filteredRecommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Image - Clickable for post details */}
                <div 
                  className="cursor-pointer relative"
                  onClick={() => handlePostClick(rec.post)}
                >
                  {rec.post.images && rec.post.images.length > 0 ? (
                    <img 
                      src={rec.post.images[0]} 
                      alt={rec.post.title}
                      className="w-full h-56 object-cover rounded-t-2xl"
                    />
                  ) : (
                    <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-400 text-4xl mb-2">📷</div>
                        <span className="text-gray-500 text-sm">No Image Available</span>
                      </div>
                    </div>
                  )}
                  {/* Confidence overlay */}
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold border ${getConfidenceColor(rec.confidence)}`}>
                    {rec.confidence.toUpperCase()}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Title - Clickable */}
                  <h3 
                    className="font-bold text-xl text-gray-800 mb-3 line-clamp-2 cursor-pointer hover:text-purple-700 transition-colors"
                    onClick={() => handlePostClick(rec.post)}
                  >
                    {rec.post.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {rec.post.description}
                  </p>

                  {/* Category & Info */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {rec.post.category && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-medium">
                        {rec.post.category}
                      </span>
                    )}
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getScoreColor(rec.score)} bg-opacity-10`}>
                      Match: {(rec.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Location & Date */}
                  <div className="text-sm text-gray-500 space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">📍</span>
                      <span className="line-clamp-1">{rec.post.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">📅</span>
                      <span>{new Date(rec.post.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Similarity Breakdown:</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Text</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(rec.breakdown?.text * 100).toFixed(0)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-700 font-medium text-xs w-8">{(rec.breakdown?.text * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Category</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(rec.breakdown?.category * 100).toFixed(0)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-700 font-medium text-xs w-8">{(rec.breakdown?.category * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Location</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full" 
                              style={{ width: `${(rec.breakdown?.location * 100).toFixed(0)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-700 font-medium text-xs w-8">{(rec.breakdown?.location * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Date</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${(rec.breakdown?.date * 100).toFixed(0)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-700 font-medium text-xs w-8">{(rec.breakdown?.date * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - IMPROVED */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handlePostClick(rec.post)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md border border-gray-200"
                    >
                      <span>View Details</span>
                      <span className="text-lg">→</span>
                    </button>
                    {!rec.post.hasClaimed ? (
                      <button
                        onClick={(e) => handleClaimButtonClick(rec.post.id, rec, e)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Claim Item
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>✓ Claimed</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ML Explanation */}
        {!loading && recommendations.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-blue-800 mb-4">How Our Matching System Works</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-blue-700 leading-relaxed mb-4">
                  We use advanced <strong>cosine similarity with TF-IDF weighting</strong> to compare your post with others in our database. 
                  The algorithm analyzes multiple dimensions to find the best possible matches.
                </p>
                <ul className="text-blue-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Text Similarity:</strong> Compares titles and descriptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Category Matching:</strong> Ensures same item types</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Location Proximity:</strong> Considers geographical relevance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Date Relevance:</strong> Matches timeframes</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-3">Confidence Levels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-medium">High (70-100%)</span>
                    <span className="text-gray-600">Excellent match</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-600 font-medium">Medium (40-69%)</span>
                    <span className="text-gray-600">Good potential</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-medium">Low (10-39%)</span>
                    <span className="text-gray-600">Possible match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;