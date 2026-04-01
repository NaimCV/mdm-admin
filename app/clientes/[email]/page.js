'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import Notification from '../../components/Notification';
import { useNotification } from '../../hooks/useNotification';
import { customersAPI } from '../../config/api';

export default function ClienteDetallePage() {
  const params = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingVerificationEmail, setSendingVerificationEmail] = useState(false);
  const { notifications, showError, showSuccess, removeNotification } = useNotification();

  const customerEmail = decodeURIComponent(params.email);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await customersAPI.getByEmail(customerEmail);
      setCustomer(data);
    } catch (error) {
      console.error('Error cargando cliente:', error);
      showError('Error al cargar el detalle del cliente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerEmail) {
      loadCustomer();
    }
  }, [customerEmail]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendVerificationEmail = async () => {
    try {
      setSendingVerificationEmail(true);
      const response = await customersAPI.sendVerificationEmail(customer.customer_email);
      showSuccess(
        `Email de verificacion reenviado correctamente para el pedido #${response.order_id}`
      );
      await loadCustomer();
    } catch (error) {
      console.error('Error reenviando email de verificación:', error);
      showError(error.message || 'No se pudo reenviar el email de verificación');
    } finally {
      setSendingVerificationEmail(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Cargando cliente...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-red-600">Cliente no encontrado</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/clientes" className="text-gray-500 hover:text-gray-700">
                ← Volver
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{customer.customer_name}</h1>
                <p className="text-sm text-gray-500 break-all">{customer.customer_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {customer.has_unverified_orders && (
                <button
                  onClick={handleSendVerificationEmail}
                  disabled={sendingVerificationEmail}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {sendingVerificationEmail ? 'Enviando...' : 'Reenviar verificacion'}
                </button>
              )}
              <button
                onClick={loadCustomer}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">{customer.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900 break-all">{customer.customer_email}</p>
              </div>
              <div>
                <p className="text-gray-500">Telefono</p>
                <p className="font-medium text-gray-900">{customer.customer_phone || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-gray-500">Cuenta vinculada</p>
                <p className="font-medium text-gray-900">{customer.user ? customer.user.username : 'Invitado'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Direccion habitual</p>
                <p className="font-medium text-gray-900">{customer.shipping_address || 'No disponible'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Pedidos</p>
                <p className="text-2xl font-semibold text-gray-900">{customer.order_count}</p>
              </div>
              <div>
                <p className="text-gray-500">Total gastado</p>
                <p className="text-2xl font-semibold text-gray-900">€{customer.total_spent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Primer pedido</p>
                <p className="font-medium text-gray-900">{formatDate(customer.first_order_date)}</p>
              </div>
              <div>
                <p className="text-gray-500">Ultimo pedido</p>
                <p className="font-medium text-gray-900">{formatDate(customer.last_order_date)}</p>
              </div>
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  customer.has_verified_order
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {customer.has_verified_order ? 'Tiene pedidos verificados' : 'Sin pedidos verificados'}
                </span>
              </div>
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  customer.has_unverified_orders
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {customer.has_unverified_orders
                    ? `${customer.unverified_order_count} pedido(s) pendientes de verificacion`
                    : 'Sin verificaciones pendientes'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pedidos del cliente</h2>
          </div>

          {customer.orders.length === 0 ? (
            <div className="p-6 text-gray-500">Este cliente todavia no tiene pedidos.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">#{order.order_code || order.id}</div>
                        <div className="text-sm text-gray-500">{order.items.length} linea(s)</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.payment_method || 'No indicado'} / {order.payment_status || 'sin estado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.email_verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.email_verified ? 'Verificado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        €{order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/pedidos/${order.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver pedido
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </AdminLayout>
  );
}
