'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useNotification } from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { ordersAPI } from '../../config/api';
import styles from './page.module.css';

export default function DetallePedido() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const { notifications, showSuccess, showError, removeNotification } = useNotification();

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await ordersAPI.getById(params.id);
      setOrder(orderData);
    } catch (error) {
      console.error('Error cargando pedido:', error);
      showError('Error al cargar los detalles del pedido');
      router.push('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return styles.statusPendiente;
      case 'confirmado':
        return styles.statusConfirmado;
      case 'enviado':
        return styles.statusEnviado;
      case 'entregado':
        return styles.statusEntregado;
      case 'cancelado':
        return styles.statusCancelado;
      default:
        return styles.statusPendiente;
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await ordersAPI.update(order.id, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      showSuccess(`Estado del pedido actualizado a: ${newStatus}`);
    } catch (error) {
      console.error('Error actualizando estado del pedido:', error);
      showError('Error al actualizar el estado del pedido');
    } finally {
      setUpdating(false);
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
        <div className="text-xl">Cargando detalles del pedido...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Pedido no encontrado</div>
      </div>
    );
  }

  return (
    <div className={styles.orderDetailContainer}>
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
      <header className={styles.header}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/pedidos" className={`${styles.backButton} mr-4`}>
                ← Volver a Pedidos
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Pedido #{order.id}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(e.target.value)}
                disabled={updating}
                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <button
                onClick={loadOrder}
                disabled={loading}
                className={`${styles.actionButton} ${styles.buttonPrimary}`}
              >
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.gridContainer}>
          {/* Información del Cliente */}
          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Información del Cliente</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="mt-1 text-sm text-gray-900">{order.customer_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <p className="text-sm text-gray-900">{order.customer_email}</p>
                    {order.email_verified ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        ✅ Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⏳ Pendiente de verificación
                      </span>
                    )}
                  </div>
                  {order.email_verified && order.email_verified_at && (
                    <p className="mt-1 text-xs text-gray-500">
                      Verificado el {new Date(order.email_verified_at).toLocaleDateString('es-ES')} a las {new Date(order.email_verified_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <p className="mt-1 text-sm text-gray-900">{order.customer_phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección de Envío</label>
                  <p className="mt-1 text-sm text-gray-900">{order.shipping_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Productos y Total */}
          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Productos del Pedido</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className={styles.productItem}>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(item.selected_options).map(([optionName, optionValue]) => (
                            <p key={optionName} className="text-sm text-gray-600">
                              <span className="font-medium">{optionName}:</span> {optionValue}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">€{item.unit_price.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Total: €{(item.quantity * item.unit_price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                <div className={styles.totalRow}>
                  <span>Total del Pedido:</span>
                  <span className={styles.totalAmount}>€{order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Pedido */}
        <div className="mt-6">
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Información del Pedido</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado Actual</label>
                <div className="mt-1">
                  <span className={`${styles.statusBadge} ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
              {order.updated_at && order.updated_at !== order.created_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Última Actualización</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.updated_at)}</p>
                </div>
              )}
              {order.notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Notas del Pedido</label>
                  <p className="mt-1 text-sm text-gray-900">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Adicionales */}
        <div className={styles.actionsContainer}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Acciones</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.print()}
                className={`${styles.actionButton} ${styles.buttonSecondary}`}
              >
                Imprimir Pedido
              </button>
              <button
                onClick={() => {
                  // Aquí puedes agregar funcionalidad para enviar email al cliente
                  showSuccess('Función de envío de email próximamente disponible');
                }}
                className={`${styles.actionButton} ${styles.buttonSuccess}`}
              >
                Enviar Email al Cliente
              </button>
              <button
                onClick={() => {
                  // Aquí puedes agregar funcionalidad para marcar como enviado
                  if (order.status === 'confirmado') {
                    updateOrderStatus('enviado');
                  }
                }}
                disabled={order.status !== 'confirmado'}
                className={`${styles.actionButton} ${styles.buttonPurple}`}
              >
                Marcar como Enviado
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
