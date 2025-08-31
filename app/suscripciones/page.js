'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNotification } from '../hooks/useNotification';
import Notification from '../components/Notification';
import AdminLayout from '../components/AdminLayout';
import { 
  MailOutlined, 
  DownloadOutlined, 
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons';

export default function EmailSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const { notifications, showSuccess, showError, removeNotification } = useNotification();

  useEffect(() => {
    loadSubscriptions();
    loadCount();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-subscriptions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar suscripciones');
      }
      
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error cargando suscripciones:', error);
      showError('Error al cargar las suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const loadCount = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-subscriptions/count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTotalCount(data.total_subscriptions);
      }
    } catch (error) {
      console.error('Error cargando contador:', error);
    }
  };

  const handleDelete = async (subscriptionId) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta suscripción?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-subscriptions/${subscriptionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al eliminar suscripción');
        }
        
        showSuccess('Suscripción eliminada exitosamente');
        await loadSubscriptions();
        await loadCount();
      } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar la suscripción');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Fecha de Registro', 'Origen', 'Notas'];
    const csvContent = [
      headers.join(','),
      ...subscriptions.map(sub => [
        sub.email,
        new Date(sub.created_at).toLocaleDateString('es-ES'),
        sub.source,
        sub.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `suscripciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Cargando suscripciones...</div>
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
                Suscripciones de Email
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <MailOutlined className="mr-1" />
                Total: {totalCount} suscripciones
              </div>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
              >
                <DownloadOutlined className="mr-2" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {subscriptions.map((subscription) => (
              <li key={subscription.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {subscription.email}
                        </h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <CalendarOutlined className="mr-1" />
                            Registrado: {new Date(subscription.created_at).toLocaleDateString('es-ES')}
                          </span>
                          <span className="flex items-center">
                            <EyeOutlined className="mr-1" />
                            Origen: {subscription.source}
                          </span>
                          {subscription.notes && (
                            <span className="text-gray-400">
                              Notas: {subscription.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscription.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex items-center space-x-2">
                    <button
                      onClick={() => handleDelete(subscription.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      <DeleteOutlined className="mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {subscriptions.length === 0 && (
            <div className="text-center py-12">
              <MailOutlined className="text-4xl text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay suscripciones
              </h3>
              <p className="text-gray-500">
                Cuando las personas se suscriban desde la página de "Próximamente", aparecerán aquí.
              </p>
            </div>
          )}
        </div>
      </main>
    </AdminLayout>
  );
}
