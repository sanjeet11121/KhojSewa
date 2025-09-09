import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/v1/admin",
  withCredentials: true, // needed if backend uses cookies/session
});

// ------------------ USERS ------------------ //

// Get all users with pagination
export const getAllUsers = async (page = 1, limit = 10) => {
  const res = await API.get(`/users?page=${page}&limit=${limit}`);
  return res.data.data; // assuming { success, data: { users, totalUsers, totalPages } }
};

// Delete a user by ID
export const deleteUserById = async (userId) => {
  const res = await API.delete(`/user/${userId}`);
  return res.data;
};

// Update user role
export const updateUserRole = async (userId, role) => {
  const res = await API.patch(`/user/${userId}/role`, { role });
  return res.data;
};

// Manually verify a user
export const manuallyVerifyUser = async (userId) => {
  const res = await API.patch(`/user/${userId}/verify`);
  return res.data;
};

// Toggle user active/block status
export const toggleUserStatus = async (userId, isActive) => {
  const res = await API.patch(`/user/${userId}/status`, { isActive });
  return res.data;
};

// Fetch single user by ID
export const getUserById = async (userId) => {
  const res = await API.get(`/user/${userId}`);
  return res.data.data; // assuming { success, data: { user } }
};

// ------------------ STATS ------------------ //

// Admin dashboard stats
export const getAdminStats = async () => {
  const res = await API.get("/stats");
  return res.data.data; // assuming { success, data: { ... } }
};

// ------------------ POSTS ------------------ //

// Fetch paginated posts
export const getPosts = async (page = 1, limit = 8) => {
  const res = await API.get(`/posts?page=${page}&limit=${limit}`);
  return res.data.data; // assuming { success, data: [...] }
};

// Update post status
export const updatePostStatus = async (postId, status) => {
  const res = await API.patch(`/posts/${postId}/status`, { status });
  return res.data;
};

// ------------------ REPORTED / INAPPROPRIATE POSTS ------------------ //

// Fetch all reported posts
export const getReportedPosts = async () => {
  const res = await API.get("/reported-posts");
  return res.data.data; // assuming { success, data: [...] }
};

// Approve a reported post
export const approveReportedPost = async (postId) => {
  const res = await API.patch(`/reported-posts/${postId}/approve`);
  return res.data;
};

// Remove (delete) a reported post
export const removeReportedPost = async (postId) => {
  const res = await API.delete(`/reported-posts/${postId}`);
  return res.data;
};

// ------------------ NOTIFICATIONS ------------------ //

// Fetch all notifications
export const getNotificationsApi = async () => {
  const res = await API.get("/notifications");
  return res.data.data; // assuming { success, data: [...] }
};

// Post a new notification
export const postNotificationApi = async (message) => {
  const res = await API.post("/notifications", { message });
  return res.data.data; // assuming { success, data: {...} }
};
