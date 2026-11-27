import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RegisterWarga from './pages/RegisterWarga';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import RtDashboard from './pages/RtDashboard';
import RwDashboard from './pages/RwDashboard';
import WargaDashboard from './pages/WargaDashboard';
import DiagnosaKoneksi from './pages/DiagnosaKoneksi';
import GantiPassword from './pages/GantiPassword';
import { getUser } from './lib/api';

/* Proteksi route — cek token & role */
function Protected({ roles, children }) {
  const user = getUser();
  if (!user || !localStorage.getItem('token')) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Root → beranda publik (tanpa login) / redirect cerdas jika sudah login */}
        <Route path="/" element={<LandingPage />} />

        {/* Autentikasi */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterWarga />} />

        {/* Ganti password — semua peran yang sudah login */}
        <Route
          path="/ganti-password"
          element={
            <Protected>
              <GantiPassword />
            </Protected>
          }
        />

        {/* Dashboard Admin */}
        <Route
          path="/dashboard"
          element={
            <Protected roles={['admin']}>
              <AdminDashboard />
            </Protected>
          }
        />

        {/* Dashboard RT */}
        <Route
          path="/rt"
          element={
            <Protected roles={['rt']}>
              <RtDashboard />
            </Protected>
          }
        />

        {/* Dashboard RW */}
        <Route
          path="/rw"
          element={
            <Protected roles={['rw']}>
              <RwDashboard />
            </Protected>
          }
        />

        {/* Dashboard Warga */}
        <Route
          path="/warga"
          element={
            <Protected roles={['warga']}>
              <WargaDashboard />
            </Protected>
          }
        />

        {/* Diagnosa Koneksi */}
        <Route path="/diagnosa" element={<DiagnosaKoneksi />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
