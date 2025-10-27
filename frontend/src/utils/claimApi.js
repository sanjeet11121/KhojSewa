// utils/claimApi.js
// const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const API_BASE =  'http://localhost:8000/api/v1';
class ClaimApi {
  constructor() {
    this.getToken = () => {
      return localStorage.getItem('accessToken');
    };
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      return { 
        success: false, 
        error: "No authentication token found. Please login again." 
      };
    }

    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/signin';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle specific error cases
      if (error.message.includes('token') || error.message.includes('auth')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/signin';
      }
      
      return { 
        success: false, 
        error: error.message || 'Network error occurred' 
      };
    }
  }

  // ✅ CORRECT: Methods as class functions
  async createClaim(claimData) {
    return this.request('/claims', {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  }

  async getPostClaims(postId, postType) {
    return this.request(`/claims/post/${postId}?type=${postType}`);
  }

  async getUserClaims(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/claims/my-claims?${params}`);
  }

  async getClaimDetails(claimId) {
    return this.request(`/claims/${claimId}`);
  }

  async updateClaimStatus(claimId, status, notes = '') {
    return this.request(`/claims/${claimId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async sendMessage(claimId, message) {
    return this.request(`/claims/${claimId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getStats() {
    return this.request('/claims/stats');
  }
}

// ✅ CORRECT: Export an instance of the class
export const claimApi = new ClaimApi();