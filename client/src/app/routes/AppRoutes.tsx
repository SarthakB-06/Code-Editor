import { Navigate, Route, Routes } from 'react-router-dom';

import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
