import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import './styles/TCGStyles.css';
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
import SearchScreen from './components/SearchScreen';
import AdminStats from './components/AdminStats';

// --- HÀM BẢO VỆ ROUTE ADMIN (ĐÃ SỬA) ---
const ProtectedAdmin = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  
  // Kiểm tra isAdmin thay vì role để khớp với MongoDB Atlas của Quân
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
        <div className="d-flex flex-column min-vh-100 bg-light">
          <Header />
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
              <Route path="/search/:keyword" element={<SearchScreen />} />

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

              {/* CHUYỂN HƯỚNG NẾU SAI ĐƯỜNG DẪN */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </PayPalScriptProvider>
  );
}

export default App;