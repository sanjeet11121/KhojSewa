// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const API_BASE_URL ='http://localhost:8000/api/v1';

export const claimItem = async (postId, postType, message) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/claims`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId,
        postType,
        message
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit claim');
    }

    return {
      success: true,
      claim: data.data,
      message: data.message
    };
  } catch (error) {
    console.error('Error submitting claim:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getMyClaims = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/claims/my-claims`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch claims');
    }

    return {
      success: true,
      claims: data.data,
      message: data.message
    };
  } catch (error) {
    console.error('Error fetching claims:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getPostClaims = async (postId, postType) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/claims/post/${postId}?type=${postType}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch post claims');
    }

    return {
      success: true,
      claims: data.data,
      message: data.message
    };
  } catch (error) {
    console.error('Error fetching post claims:', error);
    return {
      success: false,
      error: error.message
    };
  }
};