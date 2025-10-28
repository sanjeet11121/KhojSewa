import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Posts from "./admin/pages/Posts.jsx";
import Users from "./admin/pages/Users";
import Notifications from "./admin/pages/Notifications"; 
// import InappropriatePost from "./admin/pages/InappropriatePost"; 
import Home from "./pages/Home.jsx";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import ItemFound from "./pages/ItemFound.jsx"; 
import Search from "./pages/Search.jsx";
import ForgotPassword from "./pages/forgot-password.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import UserDetailPage from "./admin/pages/UserDetailPage";
import NotFound from "./pages/NotFound.jsx";
import UserInterface from "./pages/User/UserInterface.jsx";
import UserPortal from "./pages/user/UserPortal.jsx";
import UserDashboard from "./pages/user/UserDashboard.jsx";
import EditPost from "./pages/user/EditPost.jsx";
import PostDetail from "./pages/PostDetail.jsx";
import Recommendations from "./pages/User/Recommendations.jsx";
import FoundPostDetail from "./pages/User/FoundPostDetail.jsx";
import ClaimsManagement from "./pages/User/ClaimsManagement.jsx";
import ClaimsDashboard from "./components/claim/ClaimsDashboard.jsx";
import ClaimDetail from "./components/claim/ClaimDetail.jsx";
import ChatPage from './pages/User/chatPages/ChatPage';


function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  }, []);

  return (
    <Router>
  <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/ItemFound" element={<ItemFound />} />
        <Route path="/Search" element={<Search />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/user/UserInterface" element={<UserInterface />} />
        <Route path="/user" element={<UserPortal />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/user/messages" element={<ChatPage user={currentUser} />} />


        {/* Admin Pages */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} /> 
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetailPage />} /> {/* ✅ New Route for individual user */}
          <Route path="posts" element={<Posts />} />
          <Route path="notifications" element={<Notifications />} />
          {/* <Route path="inappropriatePost" element={<InappropriatePost />} /> */}
        </Route>  
        <Route path="user/edit/:postId/:type" element={<EditPost />} />
         <Route path="post/:type/:postId" element={<PostDetail />} />
        <Route path="user/recommendations/:postId" element={<Recommendations />} />
        <Route path="/found-posts/:postId" element={<FoundPostDetail />} />
        {/* Claim  Pages */}
       <Route path="/claims/dashboard" element={<ClaimsDashboard />} />
       <Route path="/claims/:claimId" element={<ClaimDetail />} />
       <Route path="/user/claims/:postId" element={<ClaimsManagement />} />

        <Route path="user/claims/:postId" element={<div style={{padding:'2rem',textAlign:'center'}}><h2>Claims Page Coming Soon!</h2></div>} />
         <Route path="*" element={<NotFound />} />  
      </Routes>

      
    </Router>
  );
}

export default App;
