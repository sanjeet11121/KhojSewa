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
      const [adminRes, postsRes, activityRes] = await Promise.all([
        adminAPI.get("/stats/overview"),
        postsAPI.get("/admin/stats/posts"),
        postsAPI.get("/admin/stats/posting-activity?period=month"),
      ]);

      const adminData = adminRes?.data?.data || adminRes?.data || {};
      const postsData = postsRes?.data?.data || postsRes?.data || {};
      const activityData = activityRes?.data?.data || activityRes?.data || {};

      const overview = postsData.overview || {};
      const lostArr = activityData?.activity?.lostPosts || [];
      const foundArr = activityData?.activity?.foundPosts || [];

      const mapCounts = (arr) => {
        const m = new Map();
        arr.forEach(it => { if (it?._id?.date) m.set(it._id.date, it.count || 0); });
        return m;
      };
      const lostMap = mapCounts(lostArr);
      const foundMap = mapCounts(foundArr);
      const dates = Array.from(new Set([...lostMap.keys(), ...foundMap.keys()])).sort();
      const monthlyData = dates.map(d => ({ month: d, lost: lostMap.get(d) || 0, found: foundMap.get(d) || 0 }));

      const merged = {
        ...adminData,
        totalLostPosts: overview.totalLostPosts || 0,
        totalFoundPosts: overview.totalFoundPosts || 0,
        pendingPosts: overview.activePosts || 0,
        monthlyData,
      };

      set({ stats: merged, loading: false });
    } catch (err) {
      console.error("fetchAdminStats error:", err);
      set({ error: extractError(err), loading: false });
    }
  },

  // ----------------- USERS -----------------
  fetchAllUsers: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      // Fetch users list first
      const res = await adminAPI.get(`/users?page=${page}&limit=${limit}`);
      const payload = res?.data?.data ?? res?.data ?? {};
      const usersArr = payload.users || [];

      // Fetch online users; skip contributors stats (backend endpoint unstable)
      const onlineRes = await adminAPI.get(`/users/online/current?limit=1000`);

      const onlineData = onlineRes?.data?.data || onlineRes?.data || {};
      const onlineSet = new Set((onlineData.onlineUsers || []).map(u => u._id));

      // No contributors stats; rely on fallback post count if available
      const postCounts = {};

      const enriched = usersArr.map(u => ({
        ...u,
        isOnline: onlineSet.has(u._id),
        postCount: postCounts[u._id] ?? (u.postCount ?? (Array.isArray(u.posts) ? u.posts.length : 0)),
      }));

      set({
        users: enriched,
        usersMeta: {
          page: payload.currentPage || page,
          totalPages: payload.totalPages || 1,
          total: payload.totalUsers || usersArr.length,
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
      // Try a direct endpoint first (if available in future)
      const res = await adminAPI.get(`/users/${userId}`);
      const payload = res.data.data || res.data;
      set({ userDetail: payload.user || payload, userDetailLoading: false });
      return payload.user || payload;
    } catch (errDirect) {
      // Fallback: list users and find locally (since backend lacks single-user fetch)
      try {
        const listRes = await adminAPI.get(`/users?page=1&limit=1000`);
        const data = listRes.data.data || listRes.data || {};
        const found = (data.users || []).find(u => u._id === userId);
        set({ userDetail: found || null, userDetailLoading: false });
        return found || null;
      } catch (errList) {
        console.error("fetchUserById fallback error:", errList);
        set({ error: extractError(errList), userDetailLoading: false });
        return null;
      }
    }
  },

  deleteUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      await adminAPI.delete(`/users/${userId}`);
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
      const res = await adminAPI.patch(`/users/${userId}/role`, { role });
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
      const res = await adminAPI.patch(`/users/${userId}/status`, { isActive });
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
      // Backend has no /admin/posts; use existing posts endpoints
      const [lostRes, foundRes] = await Promise.all([
        postsAPI.get('/lost'),
        postsAPI.get('/found'),
      ]);
      const lost = (lostRes.data.data || lostRes.data || []).map(p => ({ ...p, type: 'lost', status: p.isFound ? 'resolved' : 'active' }));
      const found = (foundRes.data.data || foundRes.data || []).map(p => ({ ...p, type: 'found', status: p.isReturned ? 'resolved' : 'active' }));
      const combined = [...lost, ...found].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Client-side pagination (backend lists are limited by server to 10 each)
      const total = combined.length;
      const start = (page - 1) * limit;
      const paged = combined.slice(start, start + limit);
      const totalPages = Math.max(1, Math.ceil(total / limit));

      set({
        posts: paged,
        postsMeta: { page, totalPages, total },
        postsLoading: false,
      });
    } catch (err) {
      console.error("fetchPosts error:", err);
      set({ error: extractError(err), postsLoading: false });
    }
  },

  updatePostStatus: async (postId, status) => {
    // Backend has no admin status endpoint; simulate locally
    set({ postsLoading: true, error: null });
    try {
      const updated = { _id: postId, status };
      set((state) => ({
        posts: (state.posts || []).map((p) =>
          p._id === postId
            ? { ...p, status,
                isFound: p.type === 'lost' ? status === 'resolved' : p.isFound,
                isReturned: p.type === 'found' ? status === 'resolved' : p.isReturned }
            : p
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
    // Backend has no /admin/notifications; return empty list to avoid 404
    set({ notificationsLoading: true, error: null });
    try {
      set({ notifications: [], notificationsLoading: false });
    } catch (err) {
      console.error("fetchNotifications error:", err);
      set({ error: extractError(err), notificationsLoading: false });
    }
  },

  postNotification: async (message) => {
    // Stub: add to local store since backend route doesn't exist
    set({ notificationsLoading: true, error: null });
    try {
      const newNote = { id: `${Date.now()}`, message, createdAt: new Date().toISOString() };
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
