import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import './styles/TCGStyles.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Bắt buộc phải có dòng này để hiển thị đúng giao diện

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Cart from './components/Cart';
import Profile from './components/Profile';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';
import AdminDashboard from './components/AdminDashboard';
import AdminOrders from './components/AdminOrders';
import AdminProductList from './components/AdminProductList';
import AdminReviewList from './components/AdminReviewList';
import AdminStats from './components/AdminStats';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ProductDetail from './components/ProductDetail';
import Shop from './components/Shop';
import Chatbot from './components/Chatbot';
import ScrollToTop from './components/ScrollToTop';

// --- HÀM BẢO VỆ ROUTE ADMIN ---
const ProtectedAdmin = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  
  // Kiểm tra isAdmin để khớp với cơ sở dữ liệu của bạn
  return userInfo && userInfo.isAdmin === true ? children : <Navigate to="/" />;
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
          <Chatbot />
          <main className="flex-grow-1">
            <Routes>
              {/* CÁC ROUTE CƠ BẢN */}
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

              {/* HỆ THỐNG ADMIN CHUYÊN NGHIỆP (ĐÃ ĐƯỢC BẢO VỆ) */}
              <Route 
                path="/admin" 
                element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} 
              />
              <Route 
                path="/admin/orders" 
                element={<ProtectedAdmin><AdminOrders /></ProtectedAdmin>} 
              />
              <Route 
                path="/admin/products" 
                element={<ProtectedAdmin><AdminProductList /></ProtectedAdmin>} 
              />
              <Route 
                path="/admin/stats" 
                element={<ProtectedAdmin><AdminStats /></ProtectedAdmin>} 
              />
              <Route 
                path="/admin/reviews" 
                element={<ProtectedAdmin><AdminReviewList /></ProtectedAdmin>} 
              />

              {/* ROUTE QUÊN MẬT KHẨU */}
              <Route path="/forgot-password" element={<ForgotPassword />} />  
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              {/* CHUYỂN HƯỚNG NẾU SAI ĐƯỜNG DẪN */}
              <Route path="*" element={<Navigate to="/" />} />
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