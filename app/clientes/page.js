'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { customersAPI } from '../config/api';

export default function ClientesPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifications, showError, removeNotification } = useNotification();

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersAPI.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      showError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Cargando clientes...</div>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-500">
                Historial agregado por cliente a partir de los pedidos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/clientes/buscar"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Buscar cliente
              </Link>
              <button
                onClick={loadCustomers}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-sm font-medium text-gray-900">No hay clientes</h3>
              <p className="mt-1 text-sm text-gray-500">Todavía no hay pedidos para agrupar clientes.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <li key={customer.customer_email}>
                  <div className="px-4 py-4 flex items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{customer.customer_name}</h3>
                          <p className="text-sm text-gray-500 break-all">{customer.customer_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            €{customer.total_spent.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {customer.order_count} pedido{customer.order_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium text-gray-700">Telefono:</span> {customer.customer_phone || 'No disponible'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Ultimo pedido:</span> {formatDate(customer.last_order_date)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Primer pedido:</span> {formatDate(customer.first_order_date)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Cuenta:</span>{' '}
                          {customer.user ? customer.user.username : 'Invitado'}
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Direccion habitual:</span>{' '}
                        {customer.shipping_address || 'No disponible'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.has_verified_order
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {customer.has_verified_order ? 'Email verificado' : 'Sin verificar'}
                      </span>
                      <Link
                        href={`/clientes/${encodeURIComponent(customer.customer_email)}`}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </AdminLayout>
  );
}
