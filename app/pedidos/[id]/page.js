'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useNotification } from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { ordersAPI, paymentsAPI } from '../../config/api';
import styles from './page.module.css';

export default function DetallePedido() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPartialRefund, setShowPartialRefund] = useState(false);
  const [partialRefundAmount, setPartialRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  
  const { notifications, showSuccess, showError, removeNotification } = useNotification();

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await ordersAPI.getById(params.id);
      console.log('🔄 Datos del pedido cargados:', orderData);
      setOrder(orderData);
    } catch (error) {
      console.error('Error cargando pedido:', error);
      showError('Error al cargar los detalles del pedido');
      router.push('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Función para forzar refresh de datos
  const refreshOrder = async () => {
    console.log('🔄 Forzando refresh de datos del pedido...');
    await loadOrder();
    showSuccess('Datos del pedido actualizados');
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

  const handleRefund = async (amount, reason = 'Solicitud del cliente') => {
    try {
      setUpdating(true);
      
      const refundData = {
        order_id: order.id,
        refund_amount: amount,
        refund_reason: reason
      };
      
      // Llamar a la API de reembolso del backend
      const response = await paymentsAPI.createRefund(refundData);
      
      if (response.error) {
        throw new Error(response.detail || 'Error al procesar el reembolso');
      }
      
      const result = await response;
      
      // Recargar el pedido para obtener la información actualizada
      await loadOrder();
      
      // Mostrar mensaje mejorado según el tipo de reembolso
      if (result.is_full_refund) {
        showSuccess(`✅ Reembolso completo procesado. El pedido ha sido cancelado. ID: ${result.refund_id}`);
      } else {
        showSuccess(`💡 Reembolso parcial de €${result.amount} procesado. El pedido se mantiene activo. ID: ${result.refund_id}`);
      }
      
      setShowPartialRefund(false);
      setPartialRefundAmount('');
      setRefundReason('');
      
    } catch (error) {
      console.error('Error procesando reembolso:', error);
      showError(error.message || 'Error al procesar el reembolso');
    } finally {
      setUpdating(false);
    }
  };

  const handlePartialRefund = async () => {
    const amount = parseFloat(partialRefundAmount);
    if (!amount || amount <= 0 || amount > order.total_amount) {
      showError('Por favor ingresa una cantidad válida para el reembolso');
      return;
    }
    
    if (!refundReason.trim()) {
      showError('Por favor ingresa un motivo para el reembolso');
      return;
    }
    
    await handleRefund(amount, refundReason.trim());
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
              <button
                onClick={refreshOrder}
                disabled={loading}
                className={`${styles.actionButton} ${styles.buttonSecondary}`}
                title="Forzar actualización de datos del pedido"
              >
                🔄 Refresh
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

        {/* Información de Pago y Reembolso */}
        {/* Mostrar información de pago si existe algún método de pago */}
        {(order.payment_method || order.stripe_payment_intent_id) && (
          <div className="mt-6">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Información de Pago</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                  <p className="mt-1 text-sm text-gray-900">Tarjeta (Stripe)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado del Pago</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.payment_status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment_status === 'succeeded' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </p>
                </div>
                {order.stripe_payment_intent_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID de Pago Stripe</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{order.stripe_payment_intent_id}</p>
                  </div>
                )}
                {order.refund_status && order.refund_status !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado del Reembolso</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.refund_status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.refund_status === 'completed' ? 'Completado' : 'En Proceso'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Opciones de Reembolso - Mostrar siempre que el pedido esté cancelado */}
        {(order.status === 'cancelado' || order.payment_method === 'card') && 
         (order.refund_status === 'none' || order.refund_status === null || order.refund_status === '') && (
          <div className="mt-6">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Procesar Reembolso</h2>
              
              {/* Mostrar mensaje diferente según el estado */}
              {order.status === 'cancelado' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Pedido Cancelado</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>• Este pedido está cancelado y requiere reembolso</p>
                        <p>• El reembolso se procesará automáticamente a la tarjeta del cliente</p>
                        <p>• Se enviará un email de confirmación al cliente</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Pedido Pagado con Tarjeta</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>• Este pedido fue pagado con tarjeta y puede ser reembolsado</p>
                        <p>• El reembolso se procesará automáticamente a la tarjeta del cliente</p>
                        <p>• El estado del pedido cambiará a "Cancelado"</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleRefund(order.total_amount)}
                  disabled={updating}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {updating ? 'Procesando...' : `Reembolsar €${order.total_amount.toFixed(2)}`}
                </button>
                <button
                  onClick={() => setShowPartialRefund(true)}
                  disabled={updating}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Reembolso Parcial
                </button>
              </div>
            </div>
          </div>
        )}

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

      {/* Modal de Reembolso Parcial */}
      {showPartialRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reembolso Parcial</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a Reembolsar (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={order.total_amount}
                  value={partialRefundAmount}
                  onChange={(e) => setPartialRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Máximo: €${order.total_amount.toFixed(2)}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del Reembolso
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe el motivo del reembolso parcial..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPartialRefund(false);
                  setPartialRefundAmount('');
                  setRefundReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handlePartialRefund}
                disabled={updating || !partialRefundAmount || !refundReason.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-orange-300 transition-colors duration-200"
              >
                {updating ? 'Procesando...' : 'Confirmar Reembolso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
