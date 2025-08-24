'use client';

import { useState, useEffect } from 'react';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  DragOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';

export default function ProductOptionsManager({ productId, onOptionsChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'input',
    required: false,
    values: []
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (productId) {
      loadOptions();
    }
  }, [productId]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/options`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOptions(data);
        if (onOptionsChange) {
          onOptionsChange(data);
        }
      }
    } catch (error) {
      console.error('Error cargando opciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    
    if (!formData.name.trim()) {
      alert('El nombre de la opción es obligatorio');
      return;
    }

    if (formData.type === 'select' && formData.values.length === 0) {
      alert('Las opciones de tipo select deben tener al menos un valor');
      return;
    }

    try {
      setLoading(true);
      
      if (editingOption) {
        // Actualizar opción existente
        const response = await fetch(`${API_BASE_URL}/api/product-options/${editingOption.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          await loadOptions();
          setEditingOption(null);
          resetForm();
        }
      } else {
        // Crear nueva opción
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}/options`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          await loadOptions();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error guardando opción:', error);
      alert('Error al guardar la opción');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (optionId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/product-options/${optionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        // Eliminación exitosa, recargar opciones
        await loadOptions();
      } else {
        // Error en la respuesta del servidor
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errorData);
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error eliminando opción:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (option) => {
    setEditingOption(option);
    setFormData({
      name: option.name,
      type: option.type,
      required: option.required,
      values: option.values.map(v => ({ value: v.value, order: v.order }))
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'input',
      required: false,
      values: []
    });
    setShowAddForm(false);
    setEditingOption(null);
  };

  const addValue = () => {
    if (formData.values.length < 10) { // Máximo 10 valores
      setFormData(prev => ({
        ...prev,
        values: [...prev.values, { value: '', order: prev.values.length }]
      }));
    }
  };

  const removeValue = (index) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const updateValue = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.map((v, i) => 
        i === index ? { ...v, [field]: value } : v
      )
    }));
  };

  const moveValue = (index, direction) => {
    if (direction === 'up' && index > 0) {
      setFormData(prev => {
        const newValues = [...prev.values];
        [newValues[index], newValues[index - 1]] = [newValues[index - 1], newValues[index]];
        return { ...prev, values: newValues };
      });
    } else if (direction === 'down' && index < formData.values.length - 1) {
      setFormData(prev => {
        const newValues = [...prev.values];
        [newValues[index], newValues[index + 1]] = [newValues[index + 1], newValues[index]];
        return { ...prev, values: newValues };
      });
    }
  };

  if (loading && options.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando opciones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Opciones del Producto</h3>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusOutlined className="mr-2" />
          Añadir Opción
        </button>
      </div>

      {/* Lista de opciones existentes */}
      {options.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {options.map((option, index) => (
              <li key={option.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <DragOutlined className="text-gray-400 cursor-move" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {option.name}
                          {option.required && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Obligatorio
                            </span>
                          )}
                        </h4>
                        <div className="text-sm text-gray-500">
                          Tipo: {option.type === 'input' ? 'Campo de texto' : 'Selector'}
                        </div>
                        {option.type === 'select' && option.values.length > 0 && (
                          <div className="text-sm text-gray-500">
                            Valores: {option.values.map(v => v.value).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(option)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EditOutlined />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(option.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulario para añadir/editar opción */}
      {showAddForm && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {editingOption ? 'Editar Opción' : 'Nueva Opción'}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="space-y-4">
            {/* Nombre de la opción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la opción *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Talla, Color, Material..."
                required
              />
            </div>

            {/* Tipo de opción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de opción *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="input">Campo de texto libre</option>
                <option value="select">Selector con opciones</option>
              </select>
            </div>

            {/* Opción obligatoria */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                Opción obligatoria
              </label>
            </div>

            {/* Valores para opciones de tipo select */}
            {formData.type === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valores de la opción *
                </label>
                <div className="space-y-2">
                  {formData.values.map((value, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={value.value}
                        onChange={(e) => updateValue(index, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Valor ${index + 1}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => moveValue(index, 'up')}
                        disabled={index === 0}
                        className="px-2 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveValue(index, 'down')}
                        disabled={index === formData.values.length - 1}
                        className="px-2 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeValue(index)}
                        className="px-2 py-2 text-red-600 hover:text-red-800"
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  ))}
                  {formData.values.length < 10 && (
                    <button
                      type="button"
                      onClick={addValue}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusOutlined className="mr-2" />
                      Añadir valor
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <SaveOutlined className="mr-2" />
                    {editingOption ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay opciones */}
      {!showAddForm && options.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay opciones configuradas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Añade opciones como talla, color, material, etc. para personalizar este producto.
          </p>
        </div>
      )}
    </div>
  );
}
