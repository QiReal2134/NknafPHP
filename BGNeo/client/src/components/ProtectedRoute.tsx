import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthToken } from '../services/api';
import { authApi } from '../services/api';

interface ProtectedRouteProps {
  children: ReactNode;
}

interface User {
  id: number;
  username: string;
  role: string;
}

interface MeResponse {
  success: boolean;
  data?: User;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const validateToken = async () => {
      const token = getAuthToken();

      if (!token) {
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      try {
        const response = await authApi.me() as unknown as MeResponse;
        if (response.success && response.data) {
          const user = response.data;
          if (user.role === 'admin') {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  if (isValidating) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div>验证中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
