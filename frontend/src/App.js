import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import './styles/TCGStyles.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- CUSTOMER & COMMON COMPONENTS ---
import Header from './components/Component/Header';
import Footer from './components/Component/Footer';
import Home from './components/Customer/Home';
import Login from './components/Customer/Login';
import Register from './components/Customer/Register';
import Cart from './components/Customer/Cart';
import Profile from './components/Customer/Profile';
import Checkout from './components/Customer/Checkout';
import OrderHistory from './components/Customer/OrderHistory';
import ForgotPassword from './components/Customer/ForgotPassword';
import ResetPassword from './components/Customer/ResetPassword';
import ProductDetail from './components/Customer/ProductDetail';
import Shop from './components/Customer/Shop';
import Chatbot from './components/Component/Chatbot';
import ScrollToTop from './components/Component/ScrollToTop';
import Wishlist from './components/Customer/Wishlist';
import BlogList from './components/Customer/BlogList';

// --- ADMIN COMPONENTS ---
import AdminDashboard from './components/AdminSide/AdminDashboard';
import AdminOrders from './components/AdminSide/AdminOrders';
import AdminProductList from './components/AdminSide/AdminProductList';
import AdminStats from './components/AdminSide/AdminStats';
import AdminStaffLogs from './components/AdminSide/AdminStaffLogs';
import AdminUserManagement from './components/AdminSide/AdminUserManagement';

// --- STAFF COMPONENTS ---
import StaffDashboard from './components/StaffSide/StaffDashboard';
import StaffBlogManagement from './components/StaffSide/StaffBlogManagement';
import StaffReviewList from './components/StaffSide/StaffReviewList';
import StaffChat from './components/StaffSide/StaffChat';

const ProtectedRoute = ({ allowedRoles }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  if (!userInfo || !userInfo.token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = userInfo.role || (userInfo.isAdmin ? 'Admin' : 'Customer');

  if (allowedRoles && allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
};

const AdminOrStaffDashboard = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const userRole = userInfo.role || (userInfo.isAdmin ? 'Admin' : 'Customer');
  
  return userRole === 'Staff' ? <StaffDashboard /> : <AdminDashboard />;
};

function App() {
  const initialOptions = {
    "client-id": "sb",
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <Router>
        <ScrollToTop />
        <div className="d-flex flex-column min-vh-100 bg-light">
          <Header />
          <main className="flex-grow-1">
            <Routes>
              {/* PUBLIC / CUSTOMER ROUTES */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-history" element={<OrderHistory />} />
              <Route path="/search/:keyword" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/blogs" element={<BlogList />} />

              {/* ROUTE DÙNG CHUNG CẢ ADMIN VÀ STAFF */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Staff']} />}>
                <Route path="/admin" element={<AdminOrStaffDashboard />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/products" element={<AdminProductList />} />
                <Route path="/admin/reviews" element={<StaffReviewList />} />
                <Route path="/admin/blogs" element={<StaffBlogManagement />} />
                <Route path="/admin/chat" element={<StaffChat />} />
              </Route>

              {/* ROUTE DÀNH RIÊNG CHO ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/admin/stats" element={<AdminStats />} />
                <Route path="/admin/staff-logs" element={<AdminStaffLogs />} />
                <Route path="/admin/users" element={<AdminUserManagement />} />
              </Route>

              <Route path="/forgot-password" element={<ForgotPassword />} />  
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Chatbot />
          <Footer />
        </div>
      </Router>

      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" 
      />
    </PayPalScriptProvider>
  );
}

export default App;