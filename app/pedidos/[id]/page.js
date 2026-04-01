'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useNotification } from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { ordersAPI, paymentsAPI } from '../../config/api';
import AdminLayout from '../../components/AdminLayout';
import styles from './page.module.css';

export default function DetallePedido() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPartialRefund, setShowPartialRefund] = useState(false);
  const [partialRefundAmount, setPartialRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showMarkPayment, setShowMarkPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showRecordTransfer, setShowRecordTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  
  // Nuevos estados para modales específicos
  const [showCompleteTransfer, setShowCompleteTransfer] = useState(false);
  const [showPartialTransfer, setShowPartialTransfer] = useState(false);
  const [showManualPayment, setShowManualPayment] = useState(false);
  
  // Estados para transferencia completa
  const [completeTransferDate, setCompleteTransferDate] = useState('');
  const [completeTransferReference, setCompleteTransferReference] = useState('');
  const [completeTransferNotes, setCompleteTransferNotes] = useState('');
  
  // Estados para transferencia parcial
  const [partialTransferAmount, setPartialTransferAmount] = useState('');
  const [partialTransferDate, setPartialTransferDate] = useState('');
  const [partialTransferReference, setPartialTransferReference] = useState('');
  const [partialTransferNotes, setPartialTransferNotes] = useState('');
  
  // Estados para pago manual
  const [manualPaymentAmount, setManualPaymentAmount] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState('efectivo');
  const [manualPaymentDate, setManualPaymentDate] = useState('');
  const [manualPaymentNotes, setManualPaymentNotes] = useState('');
  
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

  const handleMarkAsPaid = async (amount) => {
    try {
      setUpdating(true);
      
      // Actualizar el pedido como pagado
      await ordersAPI.update(order.id, { 
        payment_status: 'succeeded', 
        payment_method: 'transfer'
      });
      
      // Recargar el pedido para obtener la información actualizada
      await loadOrder();
      
      showSuccess('Pedido marcado como pagado con transferencia bancaria.');
    } catch (error) {
      console.error('Error marcando pedido como pagado:', error);
      showError('Error al marcar el pedido como pagado.');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkPartialPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      showError('Por favor ingresa una cantidad válida');
      return;
    }
    
    try {
      setUpdating(true);
      
      // Actualizar el pedido con el pago parcial
      await ordersAPI.update(order.id, { 
        payment_status: 'partial',
        payment_method: 'transfer',
        payment_notes: paymentNotes || `Pago parcial de €${amount.toFixed(2)}`
      });
      
      // Recargar el pedido para obtener la información actualizada
      await loadOrder();
      
      showSuccess(`Pago parcial de €${amount.toFixed(2)} registrado correctamente.`);
      setShowMarkPayment(false);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (error) {
      console.error('Error registrando pago parcial:', error);
      showError('Error al registrar el pago parcial.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRecordTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      showError('Por favor ingresa una cantidad válida');
      return;
    }
    
    if (!transferDate) {
      showError('Por favor selecciona la fecha de la transferencia');
      return;
    }
    
    try {
      setUpdating(true);
      
      // Calcular el total pagado hasta ahora
      const currentPaid = order.payment_status === 'succeeded' ? order.total_amount : 
                         order.payment_status === 'partial' ? (order.payment_amount || 0) : 0;
      const newTotalPaid = currentPaid + amount;
      
      // Crear nota de transferencia con todos los detalles
      const transferNote = `Transferencia recibida: €${amount.toFixed(2)} el ${new Date(transferDate).toLocaleDateString('es-ES')}${transferReference ? ` - Ref: ${transferReference}` : ''}${transferNotes ? ` - ${transferNotes}` : ''}`;
      
      // Construir el historial completo
      let fullHistory = '';
      if (order.payment_notes) {
        fullHistory = order.payment_notes + '\n' + transferNote;
      } else {
        fullHistory = transferNote;
      }
      
      // Determinar el nuevo estado del pago
      let newPaymentStatus = 'partial';
      if (newTotalPaid >= order.total_amount) {
        newPaymentStatus = 'succeeded';
      }
      
      // Actualizar el pedido con la nueva transferencia
      await ordersAPI.update(order.id, { 
        payment_status: newPaymentStatus,
        payment_method: 'transfer',
        payment_amount: newTotalPaid,
        payment_notes: fullHistory,
        updated_at: new Date().toISOString()
      });
      
      // Recargar el pedido para obtener la información actualizada
      await loadOrder();
      
      if (newPaymentStatus === 'succeeded') {
        showSuccess(`✅ Transferencia de €${amount.toFixed(2)} registrada. ¡Pedido completamente pagado!`);
      } else {
        showSuccess(`💰 Transferencia de €${amount.toFixed(2)} registrada. Total pagado: €${newTotalPaid.toFixed(2)}`);
      }
      
      // Limpiar el modal
      setShowRecordTransfer(false);
      setTransferAmount('');
      setTransferDate('');
      setTransferReference('');
      setTransferNotes('');
      
    } catch (error) {
      console.error('Error registrando transferencia:', error);
      showError('Error al registrar la transferencia.');
    } finally {
      setUpdating(false);
    }
  };

  // Nueva función para transferencia completa
  const handleCompleteTransfer = async () => {
    if (!completeTransferDate) {
      showError('Por favor selecciona la fecha de la transferencia');
      return;
    }
    
    try {
      setUpdating(true);
      
      // Crear nota de transferencia completa
      const transferNote = `Transferencia completa recibida: €${order.total_amount.toFixed(2)} el ${new Date(completeTransferDate).toLocaleDateString('es-ES')}${completeTransferReference ? ` - Ref: ${completeTransferReference}` : ''}${completeTransferNotes ? ` - ${completeTransferNotes}` : ''}`;
      
      // Construir el historial completo
      let fullHistory = '';
      if (order.payment_notes) {
        fullHistory = order.payment_notes + '\n' + transferNote;
      } else {
        fullHistory = transferNote;
      }
      
      // Actualizar el pedido como completamente pagado
      await ordersAPI.update(order.id, { 
        payment_status: 'succeeded',
        payment_method: 'transfer',
        payment_amount: order.total_amount,
        payment_notes: fullHistory,
        updated_at: new Date().toISOString()
      });
      
      // Recargar el pedido
      await loadOrder();
      showSuccess(`✅ Transferencia completa de €${order.total_amount.toFixed(2)} registrada. ¡Pedido completamente pagado!`);
      
      // Limpiar el modal
      setShowCompleteTransfer(false);
      setCompleteTransferDate('');
      setCompleteTransferReference('');
      setCompleteTransferNotes('');
      
    } catch (error) {
      console.error('Error registrando transferencia completa:', error);
      showError('Error al registrar la transferencia completa.');
    } finally {
      setUpdating(false);
    }
  };

  // Nueva función para confirmar transferencia bancaria usando el endpoint específico
  const handleConfirmBankTransfer = async () => {
    try {
      setUpdating(true);
      
      // Obtener el token de autenticación
      const token = localStorage.getItem('adminToken');
      console.log('🔑 Token obtenido:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }
      
      // Llamar al nuevo endpoint de confirmación de transferencias usando la API configurada
      console.log('🚀 Llamando a endpoint:', `${API_BASE_URL}/api/orders/${order.id}/confirm-transfer`);
        
        const response = await fetch(`${API_BASE_URL}/api/orders/${order.id}/confirm-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al confirmar la transferencia');
      }
      
      const confirmedOrder = await response.json();
      console.log('✅ Pedido confirmado:', confirmedOrder);
      
      // Recargar el pedido
      await loadOrder();
      showSuccess(`✅ Transferencia bancaria confirmada exitosamente. ¡Pedido confirmado y email enviado!`);
      
      // Limpiar el modal
      setShowCompleteTransfer(false);
      setCompleteTransferDate('');
      setCompleteTransferReference('');
      setCompleteTransferNotes('');
      
    } catch (error) {
      console.error('Error confirmando transferencia bancaria:', error);
      showError(`Error al confirmar la transferencia: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Nueva función para transferencia parcial
  const handlePartialTransfer = async () => {
    const amount = parseFloat(partialTransferAmount);
    if (!amount || amount <= 0) {
      showError('Por favor ingresa una cantidad válida');
      return;
    }
    
    if (!partialTransferDate) {
      showError('Por favor selecciona la fecha de la transferencia');
      return;
    }
    
    try {
      setUpdating(true);
      
      // Calcular el total pagado hasta ahora
      const currentPaid = order.payment_status === 'succeeded' ? order.total_amount : 
                         order.payment_status === 'partial' ? (order.payment_amount || 0) : 0;
      const newTotalPaid = currentPaid + amount;
      
      // Crear nota de transferencia parcial
      const transferNote = `Transferencia parcial recibida: €${amount.toFixed(2)} el ${new Date(partialTransferDate).toLocaleDateString('es-ES')}${partialTransferReference ? ` - Ref: ${partialTransferReference}` : ''}${partialTransferNotes ? ` - ${partialTransferNotes}` : ''}`;
      
      // Construir el historial completo
      let fullHistory = '';
      if (order.payment_notes) {
        fullHistory = order.payment_notes + '\n' + transferNote;
      } else {
        fullHistory = transferNote;
      }
      
      // Determinar el nuevo estado del pago
      let newPaymentStatus = 'partial';
      if (newTotalPaid >= order.total_amount) {
        newPaymentStatus = 'succeeded';
      }
      
      // Actualizar el pedido
      await ordersAPI.update(order.id, { 
        payment_status: newPaymentStatus,
        payment_method: 'transfer',
        payment_amount: newTotalPaid,
        payment_notes: fullHistory,
        updated_at: new Date().toISOString()
      });
      
      // Recargar el pedido
      await loadOrder();
      
      if (newPaymentStatus === 'succeeded') {
        showSuccess(`✅ Transferencia parcial de €${amount.toFixed(2)} registrada. ¡Pedido completamente pagado!`);
      } else {
        showSuccess(`💰 Transferencia parcial de €${amount.toFixed(2)} registrada. Total pagado: €${newTotalPaid.toFixed(2)}`);
      }
      
      // Limpiar el modal
      setShowPartialTransfer(false);
      setPartialTransferAmount('');
      setPartialTransferDate('');
      setPartialTransferReference('');
      setPartialTransferNotes('');
      
    } catch (error) {
      console.error('Error registrando transferencia parcial:', error);
      showError('Error al registrar la transferencia parcial.');
    } finally {
      setUpdating(false);
    }
  };

  // Nueva función para pago manual
  const handleManualPayment = async () => {
    const amount = parseFloat(manualPaymentAmount);
    if (!amount || amount <= 0) {
      showError('Por favor ingresa una cantidad válida');
      return;
    }
    
    if (!manualPaymentDate) {
      showError('Por favor selecciona la fecha del pago');
      return;
    }
    
    try {
      setUpdating(true);
      
      // Calcular el total pagado hasta ahora
      const currentPaid = order.payment_status === 'succeeded' ? order.total_amount : 
                         order.payment_status === 'partial' ? (order.payment_amount || 0) : 0;
      const newTotalPaid = currentPaid + amount;
      
      // Crear nota de pago manual
      const paymentNote = `Pago manual (${manualPaymentMethod}): €${amount.toFixed(2)} el ${new Date(manualPaymentDate).toLocaleDateString('es-ES')}${manualPaymentNotes ? ` - ${manualPaymentNotes}` : ''}`;
      
      // Construir el historial completo
      let fullHistory = '';
      if (order.payment_notes) {
        fullHistory = order.payment_notes + '\n' + paymentNote;
      } else {
        fullHistory = paymentNote;
      }
      
      // Determinar el nuevo estado del pago
      let newPaymentStatus = 'partial';
      if (newTotalPaid >= order.total_amount) {
        newPaymentStatus = 'succeeded';
      }
      
      // Actualizar el pedido
      await ordersAPI.update(order.id, { 
        payment_status: newPaymentStatus,
        payment_method: manualPaymentMethod,
        payment_amount: newTotalPaid,
        payment_notes: fullHistory,
        updated_at: new Date().toISOString()
      });
      
      // Recargar el pedido
      await loadOrder();
      
      if (newPaymentStatus === 'succeeded') {
        showSuccess(`✅ Pago manual de €${amount.toFixed(2)} registrado. ¡Pedido completamente pagado!`);
      } else {
        showSuccess(`💰 Pago manual de €${amount.toFixed(2)} registrado. Total pagado: €${newTotalPaid.toFixed(2)}`);
      }
      
      // Limpiar el modal
      setShowManualPayment(false);
      setManualPaymentAmount('');
      setManualPaymentMethod('efectivo');
      setManualPaymentDate('');
      setManualPaymentNotes('');
      
    } catch (error) {
      console.error('Error registrando pago manual:', error);
      showError('Error al registrar el pago manual.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSetPaymentMethod = async (method) => {
    try {
      setUpdating(true);
      await ordersAPI.update(order.id, { payment_method: method });
      setOrder({ ...order, payment_method: method });
      showSuccess(`Método de pago establecido como: ${method}`);
    } catch (error) {
      console.error('Error estableciendo método de pago:', error);
      showError('Error al establecer el método de pago.');
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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Cargando detalles del pedido...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-red-600">Pedido no encontrado</div>
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
      
      {/* Header de la página */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/pedidos" className="text-gray-500 hover:text-gray-700 mr-4">
                ← Volver a Pedidos
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Pedido #{order.order_code || order.id}
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
      </div>

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
        <div className="mt-6">
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Información de Pago</h2>
            
            {/* Estado del Pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                <div className="mt-1">
                  {order.payment_method ? (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.payment_method === 'stripe' ? 'bg-blue-100 text-blue-800' :
                      order.payment_method === 'transfer' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.payment_method === 'stripe' ? '💳 Tarjeta (Stripe)' :
                       order.payment_method === 'transfer' ? '🏦 Transferencia Bancaria' :
                       order.payment_method || 'No especificado'}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">No especificado</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado del Pago</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.payment_status === 'succeeded' ? 'bg-green-100 text-green-800' :
                    order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.payment_status === 'succeeded' ? '✅ Pagado' :
                     order.payment_status === 'pending' ? '⏳ Pendiente' :
                     order.payment_status === 'failed' ? '❌ Fallido' :
                     order.payment_status || 'No especificado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen Financiero */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen Financiero</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">€{order.total_amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total del Pedido</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    order.payment_status === 'succeeded' ? 'text-green-600' : 
                    order.payment_status === 'partial' ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    €{(() => {
                      if (order.payment_status === 'succeeded') return order.total_amount;
                      if (order.payment_status === 'partial') return order.payment_amount || 0;
                      return 0;
                    })().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Pagado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    €{(() => {
                      const total = order.total_amount;
                      const paid = order.payment_status === 'succeeded' ? total : 
                                  order.payment_status === 'partial' ? (order.payment_amount || 0) : 0;
                      return Math.max(0, total - paid);
                    })().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Pendiente</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    order.refund_amount && order.refund_amount > 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    €{(order.refund_amount || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Reembolsado</div>
                </div>
              </div>
              
              {/* Estado de la cuenta */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Estado de la Cuenta:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.payment_status === 'succeeded' ? 'bg-green-100 text-green-800' :
                    order.payment_status === 'partial' ? 'bg-blue-100 text-blue-800' :
                    order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.payment_status === 'succeeded' ? '✅ Cuenta Saldada' :
                     order.payment_status === 'partial' ? '💰 Pago Parcial' :
                     order.payment_status === 'pending' ? '⏳ Pendiente de Pago' :
                     '❓ Estado Desconocido'}
                  </span>
                </div>
              </div>
            </div>

            {/* Información Específica del Método de Pago */}
            {order.payment_method === 'stripe' && order.stripe_payment_intent_id && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-blue-900 mb-3">💳 Información de Stripe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700">ID de Pago Stripe</label>
                    <p className="mt-1 text-sm font-mono text-blue-900">{order.stripe_payment_intent_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Estado del Pago</label>
                    <p className="mt-1 text-sm text-blue-900">{order.payment_status}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sección de Transferencia - Mostrar siempre si no es Stripe o si no hay método definido */}
            {(order.payment_method === 'transfer' || !order.payment_method || order.payment_method === 'pending') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-green-900 mb-3">🏦 Información de Transferencia</h3>
                
                {/* Mensaje informativo sobre el nuevo sistema */}
                {order.payment_method === 'transfer' && order.status === 'pendiente' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="text-sm text-blue-800">
                      <div className="font-medium mb-1">💡 Nuevo Sistema Automatizado</div>
                      <div className="text-xs">
                        Usa el botón <strong>"🏦 Confirmar Transferencia Bancaria"</strong> para:
                        <br />
                        • Cambiar automáticamente el estado a "confirmado"
                        • Enviar email de confirmación al cliente
                        • Registrar la confirmación con fecha y admin
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-4">                  
                  {/* Mostrar historial de transferencias si existe */}
                  {order.payment_notes && (
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <h4 className="text-sm font-medium text-green-800 mb-2">📋 Historial de Transferencias:</h4>
                      <p className="text-sm text-green-700 whitespace-pre-line">{order.payment_notes}</p>
                    </div>
                  )}
                  
                  {/* Botones para gestionar pagos - Mostrar si es transferencia o si no hay método definido */}
                  {(order.payment_method === 'transfer' || !order.payment_method || order.payment_method === 'pending') && order.payment_status !== 'succeeded' && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          setCompleteTransferDate(new Date().toISOString().split('T')[0]);
                          setShowCompleteTransfer(true);
                        }}
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        {updating ? 'Procesando...' : '📥 Registrar Transferencia Completa'}
                      </button>
                      <button
                        onClick={() => {
                          setPartialTransferAmount('');
                          setPartialTransferDate(new Date().toISOString().split('T')[0]);
                          setShowPartialTransfer(true);
                        }}
                        disabled={updating}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        {updating ? 'Procesando...' : '💰 Registrar Transferencia Parcial'}
                      </button>
                      <button
                        onClick={() => handleMarkAsPaid(order.total_amount)}
                        disabled={updating}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        {updating ? 'Procesando...' : '✅ Marcar como Pagado'}
                      </button>
                      
                      {/* Botón específico para confirmar transferencias bancarias */}
                      {order.payment_method === 'transfer' && order.status === 'pendiente' && (
                        <button
                          onClick={handleConfirmBankTransfer}
                          disabled={updating}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 border-2 border-blue-300"
                        >
                          {updating ? 'Procesando...' : '🏦 Confirmar Transferencia Bancaria'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setManualPaymentAmount('');
                          setManualPaymentDate(new Date().toISOString().split('T')[0]);
                          setShowManualPayment(true);
                        }}
                        disabled={updating}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        {updating ? 'Procesando...' : '💰 Registrar Pago Manual'}
                      </button>
                    </div>
                  )}
                  
                  {/* Información del estado actual */}
                  <div className="text-sm text-green-600">
                    {order.payment_status === 'succeeded' ? 
                      '✅ Pedido completamente pagado' :
                      order.payment_status === 'partial' ? 
                      `💰 Pago parcial registrado. Pendiente: €${(order.total_amount - (order.payment_amount || 0)).toFixed(2)}` :
                      '⏳ Pendiente de confirmación de pago'
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Información de Reembolsos */}
            {order.refund_status && order.refund_status !== 'none' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-orange-900 mb-3">🔄 Información de Reembolso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700">Estado del Reembolso</label>
                    <p className="mt-1 text-sm text-orange-900">{order.refund_status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-700">Cantidad Reembolsada</label>
                    <p className="mt-1 text-sm text-orange-900">€{order.refund_amount?.toFixed(2)}</p>
                  </div>
                  {order.refund_reason && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-orange-700">Motivo del Reembolso</label>
                      <p className="mt-1 text-sm text-orange-900">{order.refund_reason}</p>
                    </div>
                  )}
                  {order.stripe_refund_id && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-orange-700">ID de Reembolso Stripe</label>
                      <p className="mt-1 text-sm font-mono text-orange-900">{order.stripe_refund_id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Opciones de Reembolso */}
            {order.payment_method === 'stripe' && 
             order.payment_status === 'succeeded' && 
             (order.refund_status === 'none' || !order.refund_status) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-900 mb-3">💳 Opciones de Reembolso</h3>
                <div className="space-y-3">
                  <p className="text-sm text-yellow-700">
                    Este pedido fue pagado con tarjeta y puede ser reembolsado.
                  </p>
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

      {/* Modal de Pago Parcial */}
      {showMarkPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Pago Parcial</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a Pagar (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={order.total_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Máximo: €${order.total_amount.toFixed(2)}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas del Pago
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas adicionales para el pago parcial..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowMarkPayment(false);
                  setPaymentAmount('');
                  setPaymentNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkPartialPayment}
                disabled={updating || !paymentAmount}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-200"
              >
                {updating ? 'Procesando...' : 'Confirmar Pago Parcial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferencia */}
      {showRecordTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Transferencia Recibida</h3>
            
            {/* Información de la transferencia */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">
                  {transferAmount && parseFloat(transferAmount) >= order.total_amount ? 
                    '✅ Transferencia completa' : 
                    transferAmount ? '💰 Transferencia parcial' : 
                    '📝 Registrando nueva transferencia'
                  }
                </div>
                <div className="text-xs">
                  Total del pedido: €{order.total_amount.toFixed(2)}
                  {transferAmount && (
                    <>
                      <br />
                      Cantidad a registrar: €{parseFloat(transferAmount).toFixed(2)}
                      <br />
                      Saldo pendiente: €{Math.max(0, order.total_amount - parseFloat(transferAmount)).toFixed(2)}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Recibida (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={order.total_amount}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Máximo: €${order.total_amount.toFixed(2)}`}
                />
                <div className="mt-1 text-xs text-gray-500">
                  Importe del pedido: €{order.total_amount.toFixed(2)}
                  {transferAmount && (
                    <span className="block mt-1">
                      Saldo pendiente: €{Math.max(0, order.total_amount - parseFloat(transferAmount)).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de la Transferencia
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia de la Transferencia (Opcional)
                </label>
                <input
                  type="text"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas sobre la transferencia..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRecordTransfer(false);
                  setTransferAmount('');
                  setTransferDate('');
                  setTransferReference('');
                  setTransferNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleRecordTransfer}
                disabled={updating || !transferAmount || !transferDate}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition-colors duration-200"
              >
                {updating ? 'Procesando...' : 'Confirmar Transferencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferencia Completa */}
      {showCompleteTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏦 Registrar Transferencia Completa</h3>
            
            {/* Información de la transferencia */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-green-800">
                <div className="font-medium mb-1">✅ Transferencia completa</div>
                <div className="text-xs">
                  Total del pedido: €{order.total_amount.toFixed(2)}
                  <br />
                  Cantidad a registrar: €{order.total_amount.toFixed(2)}
                  <br />
                  Saldo pendiente: €0.00
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de la Transferencia
                </label>
                <input
                  type="date"
                  value={completeTransferDate}
                  onChange={(e) => setCompleteTransferDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia de la Transferencia (Opcional)
                </label>
                <input
                  type="text"
                  value={completeTransferReference}
                  onChange={(e) => setCompleteTransferReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: 1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  value={completeTransferNotes}
                  onChange={(e) => setCompleteTransferNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Notas sobre la transferencia..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCompleteTransfer(false);
                  setCompleteTransferDate('');
                  setCompleteTransferReference('');
                  setCompleteTransferNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBankTransfer}
                disabled={updating || !completeTransferDate}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition-colors duration-200"
              >
                {updating ? 'Procesando...' : '✅ Confirmar Transferencia Bancaria'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferencia Parcial */}
      {showPartialTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Registrar Transferencia Parcial</h3>
            
            {/* Información de la transferencia */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">💰 Transferencia parcial</div>
                <div className="text-xs">
                  Total del pedido: €{order.total_amount.toFixed(2)}
                  {partialTransferAmount && (
                    <>
                      <br />
                      Cantidad a registrar: €{parseFloat(partialTransferAmount).toFixed(2)}
                      <br />
                      Saldo pendiente: €{Math.max(0, order.total_amount - parseFloat(partialTransferAmount)).toFixed(2)}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Recibida (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={order.total_amount}
                  value={partialTransferAmount}
                  onChange={(e) => setPartialTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Máximo: €${order.total_amount.toFixed(2)}`}
                />
                <div className="mt-1 text-xs text-gray-500">
                  Importe del pedido: €{order.total_amount.toFixed(2)}
                  {partialTransferAmount && (
                    <span className="block mt-1">
                      Saldo pendiente: €{Math.max(0, order.total_amount - parseFloat(partialTransferAmount)).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de la Transferencia
                </label>
                <input
                  type="date"
                  value={partialTransferDate}
                  onChange={(e) => setPartialTransferDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia de la Transferencia (Opcional)
                </label>
                <input
                  type="text"
                  value={partialTransferReference}
                  onChange={(e) => setPartialTransferReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  value={partialTransferNotes}
                  onChange={(e) => setPartialTransferNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas sobre la transferencia..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPartialTransfer(false);
                  setPartialTransferAmount('');
                  setPartialTransferDate('');
                  setPartialTransferReference('');
                  setPartialTransferNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handlePartialTransfer}
                disabled={updating || !partialTransferAmount || !partialTransferDate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-200"
              >
                {updating ? 'Procesando...' : 'Confirmar Transferencia Parcial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago Manual */}
      {showManualPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Registrar Pago Manual</h3>
            
            {/* Información del pago */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-purple-800">
                <div className="font-medium mb-1">💰 Pago manual</div>
                <div className="text-xs">
                  Total del pedido: €{order.total_amount.toFixed(2)}
                  {manualPaymentAmount && (
                    <>
                      <br />
                      Cantidad a registrar: €{parseFloat(manualPaymentAmount).toFixed(2)}
                      <br />
                      Saldo pendiente: €{Math.max(0, order.total_amount - parseFloat(manualPaymentAmount)).toFixed(2)}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Recibida (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={order.total_amount}
                  value={manualPaymentAmount}
                  onChange={(e) => setManualPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={`Máximo: €${order.total_amount.toFixed(2)}`}
                />
                <div className="mt-1 text-xs text-gray-500">
                  Importe del pedido: €{order.total_amount.toFixed(2)}
                  {manualPaymentAmount && (
                    <span className="block mt-1">
                      Saldo pendiente: €{Math.max(0, order.total_amount - parseFloat(manualPaymentAmount)).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={manualPaymentMethod}
                  onChange={(e) => setManualPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="cheque">🏦 Cheque</option>
                  <option value="paypal">💳 PayPal</option>
                  <option value="otro">🔧 Otro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Pago
                </label>
                <input
                  type="date"
                  value={manualPaymentDate}
                  onChange={(e) => setManualPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  value={manualPaymentNotes}
                  onChange={(e) => setManualPaymentNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Notas sobre el pago..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowManualPayment(false);
                  setManualPaymentAmount('');
                  setManualPaymentMethod('efectivo');
                  setManualPaymentDate('');
                  setManualPaymentNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualPayment}
                disabled={updating || !manualPaymentAmount || !manualPaymentDate}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 transition-colors duration-200"
              >
                {updating ? 'Procesando...' : 'Confirmar Pago Manual'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
