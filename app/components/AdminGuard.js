'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Rutas que no requieren autenticación
  const publicRoutes = ['/login', '/unauthorized'];

  useEffect(() => {
    const checkAuth = async () => {
      // Si estamos en una ruta pública, no verificar autenticación
      if (publicRoutes.includes(pathname)) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          router.push('/login');
          return;
        }

        // Verificar token con el backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          // Verificar que el usuario es admin
          if (userData.role === 'admin') {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('adminToken');
            router.push('/login');
          }
        } else {
          localStorage.removeItem('adminToken');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        localStorage.removeItem('adminToken');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // El router ya redirigió al login
  }

  return children;
} 