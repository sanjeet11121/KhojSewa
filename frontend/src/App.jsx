import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Posts from "./admin/pages/Posts.jsx";
import Users from "./admin/pages/Users";
import Notifications from "./admin/pages/Notifications"; // ✅ Import Notifications
import Home from "./pages/Home.jsx";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import ItemFound from "./pages/ItemFound.jsx"; 
import Search from "./pages/Search.jsx"
import ForgotPassword from "./pages/forgot-password.jsx"; // ✅ New Import
import AboutUs from "./pages/AboutUs.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/ItemFound" element={<ItemFound />} />
        <Route path="/Search" element={<Search />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> {/* ✅ New Route */}
        <Route path="/about" element={<AboutUs />} />

        {/* Admin Pages */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} /> 
          <Route path="users" element={<Users />} />
          <Route path="posts" element={<Posts />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>    
      </Routes>
    </Router>
  );
}

export default App;
