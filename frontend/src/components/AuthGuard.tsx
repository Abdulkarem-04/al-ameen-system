import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthGuard() {
  const token = useAuthStore((state) => state.token);

  // If no token exists, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists, render the child routes
  return <Outlet />;
}
