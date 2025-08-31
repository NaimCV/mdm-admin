'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { productsAPI, apiRequest } from '../config/api';
import { useNotification } from '../hooks/useNotification';
import Notification from '../components/Notification';
import AdminLayout from '../components/AdminLayout';

export default function Productos() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  const { notifications, showSuccess, showError, removeNotification } = useNotification();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Usar el endpoint de admin que incluye productos inactivos
      const data = await apiRequest('/api/admin/products');
      console.log('Productos cargados:', data);
      console.log('Primer producto:', data[0]);
      console.log('Campo price_with_iva del primer producto:', data[0]?.price_with_iva);
      setProducts(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
      showError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const handleCreateNew = () => {
    router.push('/productos/crear');
  };

  const handleEdit = (product) => {
    router.push(`/productos/editar/${product.id}`);
  };

  const handleDelete = async (productId) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await productsAPI.delete(productId);
        showSuccess('Producto eliminado exitosamente');
        await loadProducts();
      } catch (error) {
        console.error('Error:', error);
        
        // Si el error es 400, significa que tiene pedidos asociados
        if (error.message && error.message.includes('pedidos asociados')) {
          const shouldDeactivate = confirm(
            'Este producto tiene pedidos asociados y no se puede eliminar. ¿Deseas desactivarlo en su lugar?'
          );
          
          if (shouldDeactivate) {
            try {
              await productsAPI.toggleStatus(productId);
              showSuccess('Producto desactivado exitosamente');
              await loadProducts();
            } catch (deactivateError) {
              console.error('Error al desactivar:', deactivateError);
              showError('Error al desactivar el producto');
            }
          }
        } else {
          showError('Error al eliminar el producto');
        }
      }
    }
  };

  const handleToggleStatus = async (productId) => {
    try {
      await productsAPI.toggleStatus(productId);
      showSuccess('Estado del producto actualizado exitosamente');
      await loadProducts();
    } catch (error) {
      console.error('Error:', error);
      showError('Error al actualizar el estado del producto');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Cargando productos...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Notifications */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
        {/* Header */}
        <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-gray-500 hover:text-gray-700 mr-4">
                ← Volver
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Productos
              </h1>
            </div>
                         <div className="flex items-center">
               <button
                 onClick={handleCreateNew}
                 className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
               >
                 Nuevo Producto
               </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {products.map((product) => (
              <li key={product.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {product.image_url ? (
                      <img
                        className="h-24 w-24 rounded-lg object-cover"
                        src={product.image_url}
                        alt={product.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div className={`h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>€{product.price}</span>
                        {product.price_with_iva && (
                          <span className="text-green-600 font-medium">IVA: €{product.price_with_iva}</span>
                        )}
                        <span>Stock: {product.stock}</span>
                        {product.category && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {product.category.name}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      
                      {/* Información adicional de medidas y costes */}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                        {product.dimensions_length && product.dimensions_width && product.dimensions_height && (
                          <span>📏 {product.dimensions_length}×{product.dimensions_width}×{product.dimensions_height} cm</span>
                        )}
                        {product.weight && (
                          <span>⚖️ {product.weight} kg</span>
                        )}
                        <div>Coste: {product.production_cost || '-'} €</div>
                        <div>Margen: {product.profit_margin || '-'}%</div>
                        <div>Envío: {product.shipping_cost || '-'} €</div>
                        {product.price_with_iva && (
                          <div className="text-green-600 font-medium">Precio con IVA: {product.price_with_iva} €</div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-blue-600">
                        Margen: {product.production_cost && product.profit_margin ? 
                          `${product.profit_margin}%` : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleStatus(product.id)}
                      className={`text-sm font-medium ${
                        product.is_active 
                          ? 'text-orange-600 hover:text-orange-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {product.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </AdminLayout>
  );
} 