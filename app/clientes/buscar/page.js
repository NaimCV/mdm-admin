'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { customersAPI } from '../../config/api';
import { useNotification } from '../../hooks/useNotification';

export default function BuscarClientesPage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchTypes = [
    { value: 'all', label: 'Todos los campos', description: 'Busca por nombre, email, telefono, direccion, usuario o codigo de pedido' },
    { value: 'name', label: 'Nombre', description: 'Busca por nombre del cliente' },
    { value: 'email', label: 'Email', description: 'Busca por email del cliente' },
    { value: 'phone', label: 'Telefono', description: 'Busca por telefono del cliente' },
    { value: 'address', label: 'Direccion', description: 'Busca por direccion de envio' },
    { value: 'username', label: 'Usuario registrado', description: 'Busca por username del usuario vinculado' },
    { value: 'order_code', label: 'Codigo de pedido', description: 'Busca por alguno de sus codigos de pedido' }
  ];

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      showNotification('Por favor, introduce un termino de busqueda', 'error');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const results = await customersAPI.search(searchQuery.trim(), searchType);
      setCustomers(results);

      if (results.length === 0) {
        showNotification('No se encontraron clientes con esos criterios', 'info');
      } else {
        showNotification(`Se encontraron ${results.length} cliente(s)`, 'success');
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      showNotification('Error al buscar clientes', 'error');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCustomers([]);
    setHasSearched(false);
  };

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

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Buscar Clientes</h1>
          <p className="text-gray-600 mt-1">Encuentra clientes por sus datos o por alguno de sus pedidos</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
                  Termino de busqueda
                </label>
                <input
                  id="searchQuery"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Introduce el dato a buscar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="searchType" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de busqueda
                </label>
                <select
                  id="searchType"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  {searchTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <strong>{searchTypes.find((type) => type.value === searchType)?.label}:</strong>{' '}
              {searchTypes.find((type) => type.value === searchType)?.description}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>

              {hasSearched && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Limpiar
                </button>
              )}
            </div>
          </form>
        </div>

        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Resultados
                {customers.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({customers.length} cliente{customers.length !== 1 ? 's' : ''})
                  </span>
                )}
              </h2>
            </div>

            {customers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No se encontraron clientes con los criterios indicados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedidos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ultimo pedido</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.customer_email} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{customer.customer_name}</div>
                          <div className="text-sm text-gray-500 break-all">{customer.customer_email}</div>
                          <div className="text-sm text-gray-500">{customer.customer_phone || 'Sin telefono'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {customer.user ? customer.user.username : 'Invitado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {customer.order_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          €{customer.total_spent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(customer.last_order_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/clientes/${encodeURIComponent(customer.customer_email)}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
