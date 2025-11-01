// src/api/postApi.js
const API_BASE_URL = 'http://localhost:8000/api/v1';

export const createPost = async (postData, type) => {
    try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            throw new Error('Please login to create a post');
        }
        
        const formData = new FormData();
        
        // Append all fields to FormData
        Object.keys(postData).forEach(key => {
            if (key === 'images') {
                // Append each image file
                postData.images.forEach(image => {
                    formData.append('images', image);
                });
            } else if (key === 'locationData') {
                // Send location as JSON string
                formData.append('location', JSON.stringify(postData.locationData));
            } else {
                formData.append(key, postData[key]);
            }
        });

        // CORRECTED: Use the correct endpoint paths
        const endpoint = type === 'found' ? '/posts/found/create' : '/posts/lost/create';
        
        console.log('🚀 Posting to:', `${API_BASE_URL}${endpoint}`);
        console.log('📦 FormData contents:', {
            title: postData.title,
            description: postData.description,
            category: postData.category,
            locationData: postData.locationData,
            images: postData.images.length
        });
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type - browser will set it automatically with boundary
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ API Error Response:', data);
            throw new Error(data.message || `Failed to create ${type} post`);
        }

        console.log('✅ Post created successfully:', data);
        return {
            success: true,
            post: data.data
        };
    } catch (error) {
        console.error(`❌ Error creating ${type} post:`, error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const getLostPost = async (postId) => {
    try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            throw new Error('Please login to view posts');
        }
        
        const response = await fetch(`${API_BASE_URL}/posts/lost/${postId}`, {
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
        console.error('Error fetching lost post:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const getFoundPost = async (postId) => {
    try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            throw new Error('Please login to view posts');
        }
        
        const response = await fetch(`${API_BASE_URL}/posts/found/${postId}`, {
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
        console.error('Error fetching found post:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const updatePost = async (postId, postData, type) => {
    try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            throw new Error('Please login to update posts');
        }
        
        const formData = new FormData();
        
        Object.keys(postData).forEach(key => {
            if (key === 'images' && postData.images && postData.images.length > 0) {
                postData.images.forEach(image => {
                    formData.append('images', image);
                });
            } else if (key === 'locationData') {
                formData.append('location', JSON.stringify(postData.locationData));
            } else if (postData[key] !== undefined && postData[key] !== null) {
                formData.append(key, postData[key]);
            }
        });

        const response = await fetch(`${API_BASE_URL}/posts/${type}/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update post');
        }

        return {
            success: true,
            post: data.data
        };
    } catch (error) {
        console.error('Error updating post:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const deletePost = async (postId, type) => {
    try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            throw new Error('Please login to delete posts');
        }
        
        const response = await fetch(`${API_BASE_URL}/posts/${type}/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete post');
        }

        return {
            success: true,
            message: data.message
        };
    } catch (error) {
        console.error('Error deleting post:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const getMyPosts = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            throw new Error('Please login to view your posts');
        }
        
        const response = await fetch(`${API_BASE_URL}/posts/my`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch posts');
        }

        return {
            success: true,
            posts: data.data
        };
    } catch (error) {
        console.error('Error fetching my posts:', error);
        return {
            success: false,
            error: error.message
        };
    }
};