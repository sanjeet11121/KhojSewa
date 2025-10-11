// import { ApiResponse } from './ApiResponse.js';
// import { ApiError } from './ApiError.js';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
const API_BASE_URL =  'http://localhost:8000/api/v1';


export const fetchRecommendations = async (postId) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/real-time-matching/lost/${postId}?limit=10&minScore=0.2`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch recommendations');
    }

    return {
      recommendations: data.data?.matches || [],
      message: data.message || 'Recommendations fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return {
      error: error.message || 'Failed to fetch recommendations',
      recommendations: []
    };
  }
};

export const fetchFoundPostRecommendations = async (postId) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/real-time-matching/found/${postId}?limit=10&minScore=0.2`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch recommendations');
    }

    return {
      recommendations: data.data?.matches || [],
      message: data.message || 'Recommendations fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return {
      error: error.message || 'Failed to fetch recommendations',
      recommendations: []
    };
  }
};

export const searchSimilarPosts = async (query, type = 'both') => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${API_BASE_URL}/real-time-matching/search?query=${encodeURIComponent(query)}&type=${type}&limit=10`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to search posts');
    }

    return {
      results: data.data?.results || [],
      message: data.message || 'Search completed successfully'
    };
  } catch (error) {
    console.error('Error searching posts:', error);
    return {
      error: error.message || 'Failed to search posts',
      results: []
    };
  }
};