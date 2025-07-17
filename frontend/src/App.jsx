import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Items from "./admin/pages/Items";
import Posts from "./admin/pages/Posts.jsx";
import Users from "./admin/pages/Users";
import Home from "./pages/Home.jsx";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import Found from "./pages/Found.jsx"; 
import ForgotPassword from "./pages/forgot-password.jsx"; // ✅ New Import

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/found" element={<Found />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> {/* ✅ New Route */}

        {/* Admin Pages */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="items" element={<Items />} />
          <Route path="posts" element={<Posts />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
