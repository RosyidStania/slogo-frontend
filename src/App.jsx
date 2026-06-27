import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';
import ManageGenerus from './pages/ManageGenerus';
import ManageEvents from './pages/ManageEvents';
import UserDashboard from './pages/UserDashboard';
import ManageAttendance from './pages/ManageAttendance';
import EventSummary from './pages/EventSummary';
import LandingPage from './pages/LandingPage';
import ManageEventTypes from './pages/ManageEventTypes';
import ReportByType from './pages/ReportByType';
import UserQR from './pages/UserQR';
import UserProfile from './pages/UserProfile';
// PrivateRoute untuk menjaga keamanan rute
const PrivateRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/users'} replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* =========================================
            1. RUTE PUBLIK (Tanpa Sidebar Layout)
            ========================================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* =========================================
            2. RUTE PRIVAT (Menggunakan Sidebar Layout)
            ========================================= */}
        {/* Semua rute di dalam elemen ini otomatis terbungkus Sidebar Layout dan wajib Login */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          
          {/* Rute Khusus Admin */}
          <Route path="/admin" element={<PrivateRoute allowedRole="admin"><Dashboard /></PrivateRoute>} />
          <Route path="/admin/events" element={<PrivateRoute allowedRole="admin"><ManageEvents /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute allowedRole="admin"><ManageUsers /></PrivateRoute>} />
          <Route path="/admin/generus" element={<PrivateRoute allowedRole="admin"><ManageGenerus /></PrivateRoute>} />
          <Route path="/admin/attendance/:eventId" element={<PrivateRoute allowedRole="admin"><ManageAttendance /></PrivateRoute>} />
          <Route path="/admin/events/:eventId/summary" element={<PrivateRoute allowedRole="admin"><EventSummary /></PrivateRoute>} />
          {/* TAMBAHKAN BARIS INI: */}
          <Route path="admin/event-types" element={<PrivateRoute allowedRole="admin"><ManageEventTypes /></PrivateRoute>} />
          <Route path="/admin/reports" element={<PrivateRoute allowedRole="admin"><ReportByType /></PrivateRoute>} />
          {/* Rute Khusus User Biasa */}
          <Route path="/users" element={<PrivateRoute allowedRole="user"><UserDashboard /></PrivateRoute>} />
          <Route path="/users/qr" element={<PrivateRoute allowedRole="user"><UserQR /></PrivateRoute>} />
          <Route path="/users/profile" element={<PrivateRoute allowedRole="user"><UserProfile /></PrivateRoute>} />

        </Route>

        {/* =========================================
            3. RUTE FALLBACK (Halaman Tidak Ditemukan)
            ========================================= */}
        {/* Jika URL sembarangan, kembalikan ke Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;