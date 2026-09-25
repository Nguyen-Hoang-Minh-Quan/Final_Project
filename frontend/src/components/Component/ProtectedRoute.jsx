import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  if (!userInfo || !userInfo.token) {
    return <Navigate to="/login" replace />;
  }

  // Lấy role từ localStorage, nếu không có thì fallback dựa vào isAdmin
  const userRole = userInfo.role || (userInfo.isAdmin ? 'Admin' : 'Customer');

  if (allowedRoles && allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
};

export default ProtectedRoute;