
const API_BASE_URL ='http://localhost:8000/api/v1';

export const getLostPost = async (postId) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/lost-posts/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch post');
    }

    return {
      success: true,
      post: data.data
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getFoundPost = async (postId) => {
  try {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/found-posts/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch post');
    }

    return {
      success: true,
      post: data.data
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return {
      success: false,
      error: error.message
    };
  }
};