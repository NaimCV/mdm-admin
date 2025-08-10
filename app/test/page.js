'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Página de Prueba
        </h1>
        <p className="text-gray-600">
          Si puedes ver esta página, el admin panel funciona correctamente.
        </p>
        <div className="mt-4">
          <button 
            onClick={() => alert('¡Funciona!')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Probar JavaScript
          </button>
        </div>
      </div>
    </div>
  );
} 