'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNotification } from '../hooks/useNotification';
import Notification from '../components/Notification';
import { ordersAPI } from '../config/api';

export default function Pedidos() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const { notifications, showSuccess, showError, removeNotification } = useNotification();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await ordersAPI.getAll();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      showError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmado':
        return 'bg-blue-100 text-blue-800';
      case 'enviado':
        return 'bg-purple-100 text-purple-800';
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Actualizar el estado en el backend
      await ordersAPI.update(orderId, { status: newStatus });
      
      // Actualizar el estado local
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      showSuccess(`Estado del pedido actualizado a: ${newStatus}`);
    } catch (error) {
      console.error('Error actualizando estado del pedido:', error);
      showError('Error al actualizar el estado del pedido');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                Gestión de Pedidos
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={loadOrders}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
              <p className="mt-1 text-sm text-gray-500">No se han encontrado pedidos en el sistema.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
                            {orders.map((order) => (
                <li key={order.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              Pedido #{order.id}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {order.customer_name} - {order.customer_email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.customer_phone}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium text-gray-900">
                              €{order.total_amount.toFixed(2)}
                            </p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <strong>Dirección:</strong> {order.shipping_address}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Fecha:</strong> {formatDate(order.created_at)}
                          </p>
                        </div>
                        
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-900">Productos:</h4>
                          <ul className="mt-1 space-y-1">
                            {order.items.map((item, index) => (
                              <li key={index} className="text-sm text-gray-600">
                                {item.product.name} x{item.quantity} - €{item.unit_price.toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Ver Detalles
                        </button>
                        
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Modal de Detalles */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalles del Pedido #{selectedOrder.id}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Información del Cliente</h4>
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Nombre:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                    <p><strong>Teléfono:</strong> {selectedOrder.customer_phone}</p>
                    <p><strong>Dirección:</strong> {selectedOrder.shipping_address}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Productos</h4>
                  <div className="mt-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between py-2 border-b border-gray-200">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">€{item.unit_price.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Total: €{(item.quantity * item.unit_price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold text-lg">
                      <span>Total del Pedido:</span>
                      <span>€{selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Información del Pedido</h4>
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Fecha de Creación:</strong> {formatDate(selectedOrder.created_at)}</p>
                    <p><strong>Estado:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 