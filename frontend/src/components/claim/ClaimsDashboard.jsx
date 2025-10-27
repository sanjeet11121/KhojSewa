// components/claim/ClaimsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { claimApi } from '../../utils/claimApi';
import { useNavigate } from 'react-router-dom';

const ClaimsDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadClaims();
    loadStats();
  }, [activeTab]);

  const loadClaims = async () => {
    setLoading(true);
    const filters = activeTab === 'all' ? {} : { status: activeTab };
    
    const result = await claimApi.getUserClaims(filters);
    
    if (result.success) {
      setClaims(result.data.claims || []);
    }
    
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await claimApi.getStats();
    if (result.success) {
      setStats(result.data);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Claims', count: stats.total || 0 },
    { id: 'pending', label: 'Pending', count: stats.pending || 0 },
    { id: 'under_review', label: 'Under Review', count: stats.under_review || 0 },
    { id: 'approved', label: 'Approved', count: stats.approved || 0 },
    { id: 'rejected', label: 'Rejected', count: stats.rejected || 0 },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      under_review: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleViewClaim = (claimId) => {
    navigate(`/claims/${claimId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Claims</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {tabs.map(tab => (
          <div key={tab.id} className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{tab.count}</div>
            <div className="text-gray-600 text-sm">{tab.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {claims.map(claim => (
          <div key={claim._id} className="bg-white rounded-lg shadow border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {claim.post?.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(claim.status)}`}>
                    {formatStatus(claim.status)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2">{claim.claimMessage}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Claimed on {new Date(claim.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Score: {claim.claimScore}%</span>
                  {claim.resolution?.resolvedAt && (
                    <>
                      <span>•</span>
                      <span>Resolved on {new Date(claim.resolution.resolvedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {claim.flags?.hasEvidence && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Has Evidence</span>
                  )}
                  {claim.flags?.isUrgent && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Urgent</span>
                  )}
                </div>
              </div>

              <div className="text-right ml-4">
                <div className="text-sm text-gray-500 mb-2">
                  {claim.claimant?._id === localStorage.getItem('userId') 
                    ? 'You claimed this' 
                    : `Claimed by ${claim.claimant?.fullName}`
                  }
                </div>
                <button 
                  onClick={() => handleViewClaim(claim._id)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {claims.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No claims found
            </h3>
            <p className="text-gray-500">
              {activeTab === 'all' 
                ? "You haven't made or received any claims yet."
                : `No ${activeTab.replace('_', ' ')} claims found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimsDashboard;