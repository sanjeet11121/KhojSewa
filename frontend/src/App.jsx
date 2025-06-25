// import './App.css'
// import Footer from './components/Footer'
// import Navbar from './components/Navbar'
// function App() {
 

//   return (
//     <>
    
//       <div className="min-h-screen flex flex-col">
//       {/* Navbar */}
//       <Navbar />

//       {/* Main content takes full remaining height */}
//       <main className="flex-grow">
//         {/* your pages/routes go here */}
      
//       </main>

//       {/* Footer sticks to bottom */}
//       <Footer />
//     </div>
//     </>

//   )
// }

// export default App

import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Items from "./admin/pages/Items";
import Posts from "./admin/pages/Posts";
import Users from "./admin/pages/Users";
import Home from "./pages/Home.jsx";

function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<Home/>}>

          </Route>
        </Routes>
      <Routes>
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