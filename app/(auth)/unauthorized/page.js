'use client';

import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Acceso No Autorizado
        </h1>
        
        <p className="text-gray-600 mb-6">
          No tienes permisos de administrador para acceder a esta página. 
          Solo los usuarios con privilegios de administrador pueden acceder al panel de administración.
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/login" 
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Ir al Login
          </Link>
          
          <Link 
            href="/" 
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
} 