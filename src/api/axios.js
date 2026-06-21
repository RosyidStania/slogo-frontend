import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Gunakan environment variable untuk deployment
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// REQUEST INTERCEPTOR: Menyelipkan token ke setiap request yang keluar
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    // HARUS ada spasi setelah Bearer
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// RESPONSE INTERCEPTOR: Penjaga gawang jika terjadi error 401 dari server
api.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response && error.response.status === 401) {
    console.error("Token tidak valid / expired. Auto-logout berjalan.");
    // Hapus data yang rusak
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    
    // Jangan gunakan useNavigate di luar komponen React, gunakan window.location
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;