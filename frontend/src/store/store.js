// FILE: src/store/store.js
import { create } from "zustand";
import axios from "axios";

// ========== AUTH TOKEN UTILITY ==========
const getToken = () => {
  // ✅ Prioritize accessToken stored by login
  const access = localStorage.getItem("accessToken");
  if (access) return access;

  // Fallbacks if older keys are used
  return localStorage.getItem("token") || localStorage.getItem("admin") || null;
};

// Helper to extract meaningful error message from Axios
const extractError = (err) => {
  console.error("API error:", err);
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Unknown error"
  );
};

// ========== AXIOS INSTANCES ==========

// --- Admin API ---
const adminAPI = axios.create({
  baseURL: "http://localhost:8000/api/v1/admin",
  withCredentials: true,
});
adminAPI.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Posts API ---
const postsAPI = axios.create({
  baseURL: "http://localhost:8000/api/v1/posts",
  withCredentials: true,
});
postsAPI.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Notifications API ---
const notificationsAPI = axios.create({
  baseURL: "http://localhost:8000/api/v1/notifications",
  withCredentials: true,
});
notificationsAPI.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ========== ZUSTAND STORE ==========
export const useAdminStore = create((set, get) => ({
  loading: false,
  error: null,

  // STATS
  stats: null,

  // USERS
  users: [],
  usersMeta: { page: 1, totalPages: 1, total: 0 },
  userDetail: null,
  userDetailLoading: false,

  // POSTS
  posts: [],
  postsMeta: { page: 1, totalPages: 1, total: 0 },
  postsLoading: false,

  // NOTIFICATIONS
  notifications: [],
  notificationsLoading: false,

  // ----------------- STATS -----------------
  fetchAdminStats: async () => {
    set({ loading: true, error: null });
    try {
      const res = await adminAPI.get("/stats");
      set({ stats: res.data.data || res.data, loading: false });
    } catch (err) {
      console.error("fetchAdminStats error:", err);
      set({ error: extractError(err), loading: false });
    }
  },

  // ----------------- USERS -----------------
  fetchAllUsers: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const res = await adminAPI.get(`/users?page=${page}&limit=${limit}`);
      const payload = res.data.data || res.data;
      set({
        users: payload.users || payload,
        usersMeta: {
          page: payload.page || page,
          totalPages: payload.totalPages || 1,
          total: payload.total || (payload.users ? payload.users.length : 0),
        },
        loading: false,
      });
    } catch (err) {
      console.error("fetchAllUsers error:", err);
      set({ error: extractError(err), loading: false });
    }
  },

  fetchUserById: async (userId) => {
    set({ userDetailLoading: true, error: null, userDetail: null });
    try {
      const res = await adminAPI.get(`/user/${userId}`);
      const payload = res.data.data || res.data;
      set({ userDetail: payload.user || payload, userDetailLoading: false });
      return payload;
    } catch (err) {
      console.error("fetchUserById error:", err);
      set({ error: extractError(err), userDetailLoading: false });
      return null;
    }
  },

  deleteUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      await adminAPI.delete(`/user/${userId}`);
      set((state) => ({
        users: state.users.filter((u) => u._id !== userId),
        loading: false,
      }));
      return true;
    } catch (err) {
      console.error("deleteUser error:", err);
      set({ error: extractError(err), loading: false });
      return false;
    }
  },

  updateUserRole: async (userId, role) => {
    set({ loading: true, error: null });
    try {
      const res = await adminAPI.patch(`/user/${userId}/role`, { role });
      const updated = res.data.data || res.data;
      set((state) => ({
        users: state.users.map((u) =>
          u._id === userId ? { ...u, ...updated } : u
        ),
        loading: false,
      }));
      return updated;
    } catch (err) {
      console.error("updateUserRole error:", err);
      set({ error: extractError(err), loading: false });
      return null;
    }
  },

  toggleUserStatus: async (userId, isActive) => {
    set({ loading: true, error: null });
    try {
      const res = await adminAPI.patch(`/user/${userId}/status`, { isActive });
      const updated = res.data.data || res.data;
      set((state) => ({
        users: state.users.map((u) =>
          u._id === userId ? { ...u, ...updated } : u
        ),
        loading: false,
      }));
      return updated;
    } catch (err) {
      console.error("toggleUserStatus error:", err);
      set({ error: extractError(err), loading: false });
      return null;
    }
  },

  // ----------------- POSTS -----------------
  fetchPosts: async (page = 1, limit = 10) => {
    set({ postsLoading: true, error: null });
    try {
      const res = await adminAPI.get(`/posts?page=${page}&limit=${limit}`);
      const payload = res.data.data || res.data;
      set({
        posts: payload.posts || payload,
        postsMeta: {
          page: payload.page || page,
          totalPages: payload.totalPages || 1,
          total: payload.total || (payload.posts ? payload.posts.length : 0),
        },
        postsLoading: false,
      });
    } catch (err) {
      console.error("fetchPosts error:", err);
      set({ error: extractError(err), postsLoading: false });
    }
  },

  updatePostStatus: async (postId, status) => {
    set({ postsLoading: true, error: null });
    try {
      const res = await adminAPI.patch(`/posts/${postId}/status`, { status });
      const updated = res.data.data || res.data;
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId ? { ...p, ...updated } : p
        ),
        postsLoading: false,
      }));
      return updated;
    } catch (err) {
      console.error("updatePostStatus error:", err);
      set({ error: extractError(err), postsLoading: false });
      return null;
    }
  },

  // ----------------- NOTIFICATIONS -----------------
  fetchNotifications: async () => {
    set({ notificationsLoading: true, error: null });
    try {
      const res = await adminAPI.get("/notifications");
      const payload = res.data.data || res.data;
      set({
        notifications: payload.notifications || payload || [],
        notificationsLoading: false,
      });
    } catch (err) {
      console.error("fetchNotifications error:", err);
      set({ error: extractError(err), notificationsLoading: false });
    }
  },

  postNotification: async (message) => {
    set({ notificationsLoading: true, error: null });
    try {
      const res = await adminAPI.post("/notifications", { message });
      const newNote = res.data.data || res.data;
      set((state) => ({
        notifications: [newNote, ...(state.notifications || [])],
        notificationsLoading: false,
      }));
      return newNote;
    } catch (err) {
      console.error("postNotification error:", err);
      set({ error: extractError(err), notificationsLoading: false });
      return null;
    }
  },
}));
