import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const Layout = lazy(() => import('./components/Layout'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ManageUsers = lazy(() => import('./pages/ManageUsers'));
const ManageGenerus = lazy(() => import('./pages/ManageGenerus'));
const ManageEvents = lazy(() => import('./pages/ManageEvents'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const ManageAttendance = lazy(() => import('./pages/ManageAttendance'));
const EventSummary = lazy(() => import('./pages/EventSummary'));
const ManageEventTypes = lazy(() => import('./pages/ManageEventTypes'));
const ReportByType = lazy(() => import('./pages/ReportByType'));
const UserQR = lazy(() => import('./pages/UserQR'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const MtMembers = lazy(() => import('./pages/MtMembers'));
const MtStatistics = lazy(() => import('./pages/MtStatistics'));
const MtAttendance = lazy(() => import('./pages/MtAttendance'));
const ManageSchedules = lazy(() => import('./pages/ManageSchedules'));
const ManageNotulen = lazy(() => import('./pages/ManageNotulen'));
const NotulenEditor = lazy(() => import('./pages/NotulenEditor'));
const ManagePengurus = lazy(() => import('./pages/ManagePengurus'));

function RouteLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
      <div className="w-8 h-8 rounded-full border-3 border-teal-500 border-t-transparent animate-spin" />
      <span className="text-xs font-semibold tracking-wide">Memuat halaman...</span>
    </div>
  );
}
// PrivateRoute untuk menjaga keamanan rute
const PrivateRoute = ({ children, allowedRole, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  
  // Mendukung allowedRoles sebagai array atau allowedRole sebagai string
  const isAllowed = allowedRoles 
    ? allowedRoles.includes(role)
    : (allowedRole ? role === allowedRole : true);

  if (!isAllowed) {
    if (role === 'mt') return <Navigate to="/mt" replace />;
    if (role === 'absen_kelompok') return <Navigate to="/admin/events" replace />;
    if (role === 'operator_absensi') return <Navigate to="/admin/events" replace />;
    return <Navigate to={role === 'admin' ? '/admin' : '/users'} replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
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
          
          {/* Rute Khusus Admin, Operator Absensi & MT */}
          <Route path="/admin/events" element={<PrivateRoute allowedRoles={['admin', 'operator_absensi', 'absen_kelompok']}><ManageEvents /></PrivateRoute>} />
          <Route path="/admin/attendance/:eventId" element={<PrivateRoute allowedRoles={['admin', 'operator_absensi', 'absen_kelompok']}><ManageAttendance /></PrivateRoute>} />

          {/* Rute Khusus Admin & MT */}
          <Route path="/admin/events/:eventId/summary" element={<PrivateRoute allowedRoles={['admin', 'absen_kelompok']}><EventSummary /></PrivateRoute>} />
          <Route path="/admin/schedules" element={<PrivateRoute allowedRoles={['admin', 'absen_kelompok']}><ManageSchedules /></PrivateRoute>} />
          
          {/* Rute Khusus Admin Saja */}
          <Route path="/admin" element={<PrivateRoute allowedRole="admin"><Dashboard /></PrivateRoute>} />
          <Route path="/admin/notulen" element={<PrivateRoute allowedRole="admin"><ManageNotulen /></PrivateRoute>} />
          <Route path="/admin/notulen/:id" element={<PrivateRoute allowedRole="admin"><NotulenEditor /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute allowedRole="admin"><ManageUsers /></PrivateRoute>} />
          <Route path="/admin/generus" element={<PrivateRoute allowedRole="admin"><ManageGenerus /></PrivateRoute>} />
          <Route path="/admin/pengurus" element={<PrivateRoute allowedRole="admin"><ManagePengurus /></PrivateRoute>} />
          <Route path="/admin/event-types" element={<PrivateRoute allowedRole="admin"><ManageEventTypes /></PrivateRoute>} />
          <Route path="/admin/reports" element={<PrivateRoute allowedRole="admin"><ReportByType /></PrivateRoute>} />

          {/* Rute Khusus User Biasa */}
          <Route path="/users" element={<PrivateRoute allowedRole="user"><UserDashboard /></PrivateRoute>} />
          <Route path="/users/qr" element={<PrivateRoute allowedRole="user"><UserQR /></PrivateRoute>} />
          <Route path="/users/profile" element={<PrivateRoute allowedRole="user"><UserProfile /></PrivateRoute>} />

          {/* Rute Khusus MT */}
          <Route path="/mt" element={<PrivateRoute allowedRole="mt"><UserDashboard /></PrivateRoute>} />
          <Route path="/mt/members" element={<PrivateRoute allowedRoles={['mt', 'absen_kelompok']}><MtMembers /></PrivateRoute>} />
          <Route path="/mt/statistics" element={<PrivateRoute allowedRoles={['mt', 'absen_kelompok']}><MtStatistics /></PrivateRoute>} />
          <Route path="/mt/attendance" element={<PrivateRoute allowedRoles={['mt', 'absen_kelompok']}><MtAttendance /></PrivateRoute>} />
          <Route path="/mt/qr" element={<PrivateRoute allowedRole="mt"><UserQR /></PrivateRoute>} />
          <Route path="/mt/profile" element={<PrivateRoute allowedRole="mt"><UserProfile /></PrivateRoute>} />

        </Route>

        {/* =========================================
            3. RUTE FALLBACK (Halaman Tidak Ditemukan)
            ========================================= */}
        {/* Jika URL sembarangan, kembalikan ke Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;