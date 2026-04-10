import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';

import { getAccessToken } from '../../features/auth/authService';

const RequireAuth = () => {
  const token = getAccessToken();
  if (!token) return <Navigate to="/auth" replace />;
  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
