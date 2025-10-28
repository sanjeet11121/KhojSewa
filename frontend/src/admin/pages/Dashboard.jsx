// FILE: src/pages/admin/Dashboard.jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useEffect, useMemo } from "react";
import { useAdminStore } from "../../store/store";

const COLORS = ["#0088FE", "#FF8042"];
const COLORS1 = ["#12b95a", "#534e4b"];

export default function Dashboard() {
  const { stats, loading, error, fetchAdminStats } = useAdminStore();

  // ----------------- HOOKS -----------------
  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  // Memoized chart data (called unconditionally at top)
  const pieData = useMemo(() => [
    { name: "Found", value: stats?.totalFoundPosts || 0 },
    { name: "Lost", value: stats?.totalLostPosts || 0 },
  ], [stats]);

  const userStatsData = useMemo(() => [
    { name: "Active Users", value: stats?.activeUsers || 0 },
    { name: "Inactive Users", value: (stats?.totalUsers || 0) - (stats?.activeUsers || 0) },
  ], [stats]);

  const pendingPostsData = useMemo(() => [
    { name: "Pending", pending: stats?.pendingPosts || 0 },
  ], [stats]);

  const lineData = useMemo(() => {
    if (stats?.monthlyData && Array.isArray(stats.monthlyData)) {
      return stats.monthlyData;
    }
    return [
      { month: "Jan", found: 4, lost: 6 },
      { month: "Feb", found: 7, lost: 5 },
      { month: "Mar", found: 3, lost: 8 },
      { month: "Apr", found: 5, lost: 2 },
      { month: "May", found: 9, lost: 7 },
      { month: "Jun", found: 6, lost: 4 },
    ];
  }, [stats]);

  // ----------------- CONDITIONAL RENDERING -----------------
  if (loading) return <p className="p-4">Loading dashboard...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!stats) return <p className="p-4">No stats available</p>;

  // ----------------- RENDER -----------------
  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Dashboard Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Total Registered Users</h3>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalUsers || 0}</p>
          </div>
          <div className="text-blue-500 text-4xl">👤</div>
        </div>

        <div className="bg-white p-4 rounded shadow flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Total Inquiries</h3>
            <p className="text-3xl font-bold text-orange-500 mt-1">{stats.totalInquiries || 0}</p>
          </div>
          <div className="text-orange-400 text-4xl">📩</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Items Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
              <Line type="monotone" dataKey="found" stroke="#0088FE" />
              <Line type="monotone" dataKey="lost" stroke="#FF8042" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: Found vs Lost */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Found vs Lost</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Pending Posts */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Pending Posts</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pendingPostsData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pending" fill="#f34a61" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: User Statistics */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-2">User Statistics</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userStatsData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
                labelLine={false}
              >
                {userStatsData.map((entry, index) => (
                  <Cell key={index} fill={COLORS1[index % COLORS1.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
