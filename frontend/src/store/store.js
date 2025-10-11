// FILE: src/store/store.js
import { create } from "zustand";
import axios from "axios";

/*
  Central admin store (Zustand).
  - Uses adminAPI for admin-specific endpoints at /api/v1/admin
  - Uses postsAPI for post endpoints at /api/v1/posts (for admin post management)
  - Token is read from localStorage key "token" by default; adjust if you store it differently.
  - All async actions set loading / error where relevant.
*/

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const adminAPI = axios.create({
  baseURL: "http://localhost:8000/api/v1/admin",
  withCredentials: true,
});

const postsAPI = axios.create({
  baseURL: "http://localhost:8000/api/v1/posts",
  withCredentials: true,
});

const notificationsAPI = axios.create({
  baseURL: "http://localhost:8000/api/v1/notifications",
  withCredentials: true,
});

export const useAdminStore = create((set, get) => ({
  // Global
  loading: false,
  error: null,

  // Admin dashboard stats
  stats: null,

  // Users
  users: [],
  usersMeta: { page: 1, totalPages: 1, total: 0 },

  // Single user detail cache
  userDetail: null,
  userDetailLoading: false,

  // Posts (admin view)
  posts: [],
  postsMeta: { page: 1, totalPages: 1, total: 0 },
  postsLoading: false,

  // Notifications
  notifications: [],
  notificationsLoading: false,

  // ---------- Stats ----------
  fetchAdminStats: async () => {
    set({ loading: true, error: null });
    try {
      const res = await adminAPI.get("/stats", {
        headers: getAuthHeaders(),
      });
      set({ stats: res.data.data || res.data, loading: false });
    } catch (err) {
      console.error("fetchAdminStats error:", err);
      set({ error: "Failed to load admin stats", loading: false });
    }
  },

  // ---------- Users ----------
  fetchAllUsers: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const res = await adminAPI.get(`/users?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders(),
      });
      // Expecting backend to respond with pagination: { users, page, totalPages, total }
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
      set({ error: "Failed to load users", loading: false });
    }
  },

  fetchUserById: async (userId) => {
    set({ userDetailLoading: true, error: null, userDetail: null });
    try {
      const res = await adminAPI.get(`/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      const payload = res.data.data || res.data;
      set({ userDetail: payload.user || payload, userDetailLoading: false });
      return payload;
    } catch (err) {
      console.error("fetchUserById error:", err);
      set({ error: "Failed to fetch user", userDetailLoading: false });
      return null;
    }
  },

  deleteUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      await adminAPI.delete(`/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      set((state) => ({
        users: state.users.filter((u) => u._id !== userId),
        loading: false,
      }));
      return true;
    } catch (err) {
      console.error("deleteUser error:", err);
      set({ error: "Failed to delete user", loading: false });
      return false;
    }
  },

  updateUserRole: async (userId, role) => {
    set({ loading: true, error: null });
    try {
      const res = await adminAPI.patch(
        `/user/${userId}/role`,
        { role },
        { headers: getAuthHeaders() }
      );
      const updated = res.data.data || res.data;
      set((state) => ({
        users: state.users.map((u) => (u._id === userId ? { ...u, ...updated } : u)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      console.error("updateUserRole error:", err);
      set({ error: "Failed to update role", loading: false });
      return null;
    }
  },

  toggleUserStatus: async (userId, isActive) => {
    set({ loading: true, error: null });
    try {
      const res = await adminAPI.patch(
        `/user/${userId}/status`,
        { isActive },
        { headers: getAuthHeaders() }
      );
      const updated = res.data.data || res.data;
      set((state) => ({
        users: state.users.map((u) => (u._id === userId ? { ...u, ...updated } : u)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      console.error("toggleUserStatus error:", err);
      set({ error: "Failed to toggle status", loading: false });
      return null;
    }
  },

  // ---------- Posts (admin) ----------
  fetchPosts: async (page = 1, limit = 10) => {
    set({ postsLoading: true, error: null });
    try {
      // NOTE: backend admin posts endpoint may differ. We call /admin/posts on postsAPI or adminAPI.
      // First try adminAPI /posts, fallback to postsAPI /?page=...
      let res;
      try {
        res = await adminAPI.get(`/posts?page=${page}&limit=${limit}`, {
          headers: getAuthHeaders(),
        });
      } catch (e) {
        res = await postsAPI.get(`?page=${page}&limit=${limit}`, {
          headers: getAuthHeaders(),
        });
      }
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
      set({ error: "Failed to fetch posts", postsLoading: false });
    }
  },

  updatePostStatus: async (postId, status) => {
    set({ postsLoading: true, error: null });
    try {
      // Attempt admin endpoint first
      let res;
      try {
        res = await adminAPI.patch(`/posts/${postId}/status`, { status }, { headers: getAuthHeaders() });
      } catch (e) {
        // fallback to postsAPI
        res = await postsAPI.patch(`/${postId}/status`, { status }, { headers: getAuthHeaders() });
      }
      const updated = res.data.data || res.data;
      set((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? { ...p, ...updated } : p)),
        postsLoading: false,
      }));
      return updated;
    } catch (err) {
      console.error("updatePostStatus error:", err);
      set({ error: "Failed to update post status", postsLoading: false });
      return null;
    }
  },

  // ---------- Notifications ----------
  fetchNotifications: async () => {
    set({ notificationsLoading: true, error: null });
    try {
      // Try admin notifications endpoint; fallback to common notifications path
      let res;
      try {
        res = await adminAPI.get("/notifications", { headers: getAuthHeaders() });
      } catch (e) {
        res = await notificationsAPI.get("/", { headers: getAuthHeaders() });
      }
      const payload = res.data.data || res.data;
      set({ notifications: payload.notifications || payload || [], notificationsLoading: false });
    } catch (err) {
      console.error("fetchNotifications error:", err);
      set({ error: "Failed to fetch notifications", notificationsLoading: false });
    }
  },

  postNotification: async (message) => {
    set({ notificationsLoading: true, error: null });
    try {
      // Post notification via admin route if available
      let res;
      try {
        res = await adminAPI.post("/notifications", { message }, { headers: getAuthHeaders() });
      } catch (e) {
        res = await notificationsAPI.post("/", { message }, { headers: getAuthHeaders() });
      }
      const newNote = res.data.data || res.data;
      set((state) => ({ notifications: [newNote, ...(state.notifications || [])], notificationsLoading: false }));
      return newNote;
    } catch (err) {
      console.error("postNotification error:", err);
      set({ error: "Failed to post notification", notificationsLoading: false });
      return null;
    }
  },
}));
