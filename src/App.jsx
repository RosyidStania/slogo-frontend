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
import MtMembers from './pages/MtMembers';
import MtStatistics from './pages/MtStatistics';
import MtAttendance from './pages/MtAttendance';
// PrivateRoute untuk menjaga keamanan rute
const PrivateRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  
  if (allowedRole && role !== allowedRole) {
    if (role === 'mt') return <Navigate to="/mt" replace />;
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

          {/* Rute Khusus MT */}
          <Route path="/mt" element={<PrivateRoute allowedRole="mt"><UserDashboard /></PrivateRoute>} />
          <Route path="/mt/members" element={<PrivateRoute allowedRole="mt"><MtMembers /></PrivateRoute>} />
          <Route path="/mt/statistics" element={<PrivateRoute allowedRole="mt"><MtStatistics /></PrivateRoute>} />
          <Route path="/mt/attendance" element={<PrivateRoute allowedRole="mt"><MtAttendance /></PrivateRoute>} />
          <Route path="/mt/qr" element={<PrivateRoute allowedRole="mt"><UserQR /></PrivateRoute>} />
          <Route path="/mt/profile" element={<PrivateRoute allowedRole="mt"><UserProfile /></PrivateRoute>} />

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