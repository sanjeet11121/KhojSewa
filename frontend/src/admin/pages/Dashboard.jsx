import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { getAdminStats } from "../services/adminApi";


const COLORS = ["#0088FE", "#FF8042"];
const COLORS1 = ["#12b95aff", "#534e4bff"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Unable to load stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <p className="p-4">Loading dashboard...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  // Map backend data to chart format
  const lineData = stats.itemsOverTime || [];
  const pieData = [
    { name: "Found", value: stats.foundCount || 0 },
    { name: "Lost", value: stats.lostCount || 0 },
  ];
  const pendingPostsData = stats.pendingPosts || [];
  const userStatsData = [
    { name: "Active Users", value: stats.activeUsers || 0 },
    { name: "Inactive Users", value: stats.inactiveUsers || 0 },
  ];

  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Dashboard Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Total Registered Users</h3>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalUsers}</p>
          </div>
          <div className="text-blue-500 text-4xl">👤</div>
        </div>

        <div className="bg-white p-4 rounded shadow flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Software Inquiries</h3>
            <p className="text-3xl font-bold text-orange-500 mt-1">{stats.softwareInquiries}</p>
          </div>
          <div className="text-orange-400 text-4xl">📩</div>
        </div>
      </div>

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
              <Line type="monotone" dataKey="found" stroke="#0088FE" animationDuration={1000} />
              <Line type="monotone" dataKey="lost" stroke="#FF8042" animationDuration={1000} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart (Found vs Lost) */}
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

        {/* Bar Chart (Pending Posts) */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Pending Posts</h2>
          <ResponsiveContainer width="60%" height={250}>
            <BarChart data={pendingPostsData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pending" fill="#f34a61ff" animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart (User Statistics) */}
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
                  <Cell key={`cell-${index}`} fill={COLORS1[index % COLORS1.length]} />
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
