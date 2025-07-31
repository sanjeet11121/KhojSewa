import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

const lineData = [
  { month: "Jan", found: 10, lost: 5 },
  { month: "Feb", found: 20, lost: 10 },
  { month: "Mar", found: 15, lost: 12 },
  { month: "Apr", found: 30, lost: 18 },
];

const pieData = [
  { name: "Found", value: 70 },
  { name: "Lost", value: 30 },
];

const pendingPostsData = [
  { name: "Jan", pending: 10 },
  { name: "Feb", pending: 14 },
  { name: "Mar", pending: 8 },
  { name: "Apr", pending: 20 },
];

const userStatsData = [
  { name: "Active Users", value: 75 },
  { name: "Inactive Users", value: 25 },
];

const COLORS = ["#0088FE", "#FF8042"];
const COLORS1 = ["#12b95aff", "#534e4bff"];

export default function Dashboard() {
  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Dashboard Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Total Users */}
        <div className="bg-white p-4 rounded shadow flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Total Registered Users</h3>
            <p className="text-3xl font-bold text-blue-600 mt-1">120</p>
          </div>
          <div className="text-blue-500 text-4xl">
            👤
          </div>
        </div>

        {/* Total Software Inquiries */}
        <div className="bg-white p-4 rounded shadow flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Software Inquiries</h3>
            <p className="text-3xl font-bold text-orange-500 mt-1">36</p>
          </div>
          <div className="text-orange-400 text-4xl">
            📩
          </div>
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
