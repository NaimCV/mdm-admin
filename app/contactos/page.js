'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { contactAPI } from '../config/api';
import { useNotification } from '../hooks/useNotification';
import Notification from '../components/Notification';
import { 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  DeleteOutlined,
  MessageOutlined,
  ReloadOutlined
} from '@ant-design/icons';

export default function ContactosAdmin() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [unreadCount, setUnreadCount] = useState(0);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  
  const { notifications, showSuccess, showError, removeNotification } = useNotification();
  const router = useRouter();
  
  useEffect(() => {
    loadContacts();
    loadUnreadCount();
  }, [filterStatus]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      let contactsData;
      
      if (filterStatus === 'todos') {
        contactsData = await contactAPI.getAll();
      } else {
        contactsData = await contactAPI.getAll(); // La API filtrará por status
        contactsData = contactsData.filter(contact => contact.status === filterStatus);
      }
      
      setContacts(contactsData);
    } catch (error) {
      console.error('Error cargando contactos:', error);
      showError('Error al cargar los contactos');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await contactAPI.getUnreadCount();
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Error cargando contador de no leídos:', error);
    }
  };

  const handleStatusChange = async (contactId, newStatus) => {
    try {
      await contactAPI.update(contactId, { status: newStatus });
      showSuccess('Estado actualizado correctamente');
      loadContacts();
      loadUnreadCount();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      showError('Error al actualizar el estado');
    }
  };

  const handleResponse = async (contactId, response) => {
    if (!response.trim()) {
      showError('Por favor, escribe una respuesta antes de enviar');
      return;
    }
    
    try {
      setSendingResponse(true);
      await contactAPI.update(contactId, { 
        response, 
        status: 'respondido'
      });
      showSuccess('Respuesta enviada correctamente y email enviado al cliente');
      
      // Actualizar la lista de contactos
      loadContacts();
      loadUnreadCount();
      
      // Ocultar el formulario de respuesta
      setShowResponseForm(false);
      
      // Cerrar el modal después de un breve delay para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        setShowModal(false);
        setSelectedContact(null);
        setResponseText('');
      }, 1500);
      
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      showError('Error al enviar la respuesta');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleDelete = async (contactId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
      return;
    }

    try {
      await contactAPI.delete(contactId);
      showSuccess('Contacto eliminado correctamente');
      loadContacts();
      loadUnreadCount();
    } catch (error) {
      console.error('Error eliminando contacto:', error);
      showError('Error al eliminar el contacto');
    }
  };

  const openContactModal = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
    setResponseText('');
    setShowResponseForm(!contact.response); // Mostrar formulario solo si no hay respuesta
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      nuevo: { color: 'bg-blue-100 text-blue-800', icon: <MessageOutlined />, label: 'Nuevo' },
      leído: { color: 'bg-yellow-100 text-yellow-800', icon: <EyeOutlined />, label: 'Leído' },
      respondido: { color: 'bg-green-100 text-green-800', icon: <CheckOutlined />, label: 'Respondido' },
      cerrado: { color: 'bg-gray-100 text-gray-800', icon: <CloseOutlined />, label: 'Cerrado' }
    };

    const config = statusConfig[status] || statusConfig.nuevo;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon} <span className="ml-1">{config.label}</span>
      </span>
    );
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ['nuevo', 'leído', 'respondido', 'cerrado'];
    return allStatuses.filter(status => status !== currentStatus);
  };

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

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Contactos</h1>
            <p className="text-gray-600">Gestiona las consultas y mensajes de los clientes</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">No leídos</div>
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            </div>
            <button
              onClick={() => { loadContacts(); loadUnreadCount(); }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar"
            >
              <ReloadOutlined />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="todos">Todos</option>
              <option value="nuevo">Nuevos</option>
              <option value="leído">Leídos</option>
              <option value="respondido">Respondidos</option>
              <option value="cerrado">Cerrados</option>
            </select>
          </div>
        </div>

        {/* Lista de Contactos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando contactos...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center">
              <MessageOutlined className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay contactos para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asunto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contact.nombre}</div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {contact.asunto || 'Sin asunto'}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {contact.mensaje.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contact.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(contact.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openContactModal(contact)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded"
                            title="Ver detalles"
                          >
                            <EyeOutlined />
                          </button>
                          
                          <select
                            value={contact.status}
                            onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            {getStatusOptions(contact.status).map(status => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                          
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Eliminar"
                          >
                            <DeleteOutlined />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles del Contacto */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalles del Contacto
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <CloseOutlined />
                </button>
              </div>

              <div className="space-y-4">
                {/* Información del Cliente */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Nombre:</span>
                      <span className="ml-2 text-gray-900">{selectedContact.nombre}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{selectedContact.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Asunto:</span>
                      <span className="ml-2 text-gray-900">{selectedContact.asunto || 'Sin asunto'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fecha:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(selectedContact.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mensaje */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Mensaje</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedContact.mensaje}</p>
                  </div>
                </div>

                {/* Respuesta del Admin */}
                {selectedContact.response && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Historial de Respuestas</h4>
                    
                    {/* Historial de respuestas múltiples (prioritario) */}
                    {selectedContact.responses && selectedContact.responses.length > 0 ? (
                      <div className="space-y-3">
                        {selectedContact.responses.map((response, index) => (
                          <div key={response.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Respuesta #{index + 1}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(response.created_at).toLocaleString('es-ES')}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{response.response_text}</p>
                            <div className="mt-2 text-sm text-gray-500">
                              Por: {response.admin_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Respuesta principal (solo si no hay respuestas múltiples) */
                      <div className="bg-blue-50 p-4 rounded-lg mb-3">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedContact.response}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          Respondido por: {selectedContact.responded_by} el {new Date(selectedContact.responded_at).toLocaleString('es-ES')}
                        </div>
                      </div>
                    )}
                    
                    {/* Botón para agregar respuesta adicional */}
                    {!showResponseForm && (
                      <button
                        onClick={() => setShowResponseForm(true)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        ➕ Agregar Respuesta Adicional
                      </button>
                    )}
                  </div>
                )}

                {/* Formulario de Respuesta */}
                {showResponseForm && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Responder</h4>
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Nota:</strong> Cuando envíes una respuesta, se enviará automáticamente un email al cliente con tu respuesta.
                      </p>
                    </div>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Escribe tu respuesta aquí..."
                      disabled={sendingResponse}
                    />
                    
                    <div className="mt-3 flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setSelectedContact(null);
                          setResponseText('');
                          setShowResponseForm(false);
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        disabled={sendingResponse}
                      >
                        Cancelar
                      </button>
                      
                      <button
                        onClick={() => {
                          if (responseText.trim()) {
                            handleResponse(selectedContact.id, responseText);
                          } else {
                            alert('Por favor, escribe una respuesta antes de enviar');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                      >
                        ✅ Enviar Respuesta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
