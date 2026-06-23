import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Trỏ thẳng cổng vào Backend Node.js
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chốt chặn tự động nhét Token vào Header khi gửi request lên Backend
axiosClient.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo') 
      ? JSON.parse(localStorage.getItem('userInfo')) 
      : null;

    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;