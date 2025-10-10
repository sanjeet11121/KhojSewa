// export const api = "https://dull-gold-clam-tutu.cyclic.app"
// export const api = "https://lostandfound-api.onrender.com";

// export const api = "https://lost-and-found-api-nine.vercel.app";

// config.js
// export const api = {

//   baseURL:'http://localhost:8000',
  
//   // API endpoints
//   endpoints: {
//     foundPosts: '/api/v1/found-posts',
//     lostPosts: '/api/v1/lost-posts',
//     claims: '/api/v1/claims',
//     notifications: '/api/v1/notifications',
//     users: '/api/v1/users'
//   }
// };

export const api = "http://localhost:8000";
// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${api.baseURL}${endpoint}`, config);
    
    // Check if response is HTML (server error)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('Server returned HTML instead of JSON. Check if backend is running.');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('API call failed:', error);
    return { 
      success: false, 
      error: error.message,
      data: null 
    };
  }
};