'use client';

import { useState, useEffect } from 'react';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons';

export default function BackendImageUpload({ 
  productId, 
  onImageUploaded, 
  onImageDeleted,
  onImagePrimaryChanged,
  currentImages = [],
  isMultiple = false 
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState(currentImages);

  // Sincronizar el estado local cuando cambien las currentImages
  useEffect(() => {
    setUploadedImages(currentImages);
  }, [currentImages]);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validar archivos
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona solo archivos de imagen válidos');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 50MB permitido (se optimizará automáticamente)');
        return;
      }
    }

    await uploadImages(files);
  };

  const uploadImages = async (files) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const formData = new FormData();
      
      if (isMultiple) {
        // Subir múltiples imágenes
        files.forEach(file => {
          formData.append('files', file);
        });

        const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images/multiple`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Error al subir las imágenes');
        }

        const uploadedImages = await response.json();
        setUploadedImages(prev => [...prev, ...uploadedImages]);
        
        if (onImageUploaded) {
          onImageUploaded(uploadedImages);
        }
      } else {
        // Subir imagen única
        formData.append('file', files[0]);
        formData.append('is_primary', 'true');

        const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Error al subir la imagen');
        }

        const uploadedImage = await response.json();
        setUploadedImages([uploadedImage]);
        
        if (onImageUploaded) {
          onImageUploaded(uploadedImage);
        }
      }

      setUploadProgress(100);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(`Error al subir las imágenes: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al eliminar la imagen');
      }

      // Actualizar estado local
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
      
      if (onImageDeleted) {
        onImageDeleted(imageId);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(`Error al eliminar la imagen: ${error.message}`);
    }
  };

  const setPrimaryImage = async (imageId) => {
    try {
      // Actualizar estado local inmediatamente para feedback visual
      setUploadedImages(prev => 
        prev.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }))
      );

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images/${imageId}/set-primary`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al establecer imagen primaria');
      }

      // La respuesta fue exitosa, el estado ya está actualizado
      console.log('Imagen establecida como primaria exitosamente');
      
      // Notificar al componente padre del cambio
      if (onImagePrimaryChanged) {
        const updatedImages = uploadedImages.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }));
        onImagePrimaryChanged(updatedImages);
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      alert(`Error al establecer imagen primaria: ${error.message}`);
      
      // Revertir el cambio si hubo error
      setUploadedImages(prev => 
        prev.map(img => ({
          ...img,
          is_primary: img.is_primary // Mantener el estado original
        }))
      );
    }
  };

  const reorderImages = async (newOrder) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const imageOrders = newOrder.map((imageId, index) => ({
        image_id: imageId,
        order: index
      }));

      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(imageOrders)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al reordenar las imágenes');
      }

      // Actualizar estado local con el nuevo orden
      const reorderedImages = newOrder.map(imageId => 
        uploadedImages.find(img => img.id === imageId)
      ).filter(Boolean);
      
      setUploadedImages(reorderedImages);
    } catch (error) {
      console.error('Error reordering images:', error);
      alert(`Error al reordenar las imágenes: ${error.message}`);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(uploadedImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrder = items.map(item => item.id);
    reorderImages(newOrder);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect({ target: { files } });
    }
  };

  return (
    <div className="space-y-4">
      {/* Información sobre optimización */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Optimización Automática
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Las imágenes se optimizarán automáticamente antes de subirse:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Redimensionamiento a máximo 1200x1200 píxeles</li>
                <li>Compresión JPEG con alta calidad</li>
                <li>Conversión automática de formatos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Área de subida */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
          uploading 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-3">
            <LoadingOutlined className="text-2xl text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600">
              {isMultiple ? 'Subiendo imágenes...' : 'Subiendo imagen...'}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <UploadOutlined className="text-3xl text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                Arrastra y suelta {isMultiple ? 'imágenes' : 'una imagen'} aquí, o{' '}
                <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                  selecciona {isMultiple ? 'archivos' : 'un archivo'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple={isMultiple}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF hasta 50MB {isMultiple ? 'cada una' : ''} (se optimizarán automáticamente)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Galería de imágenes */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <CheckCircleOutlined className="text-green-600" />
            <span className="text-sm text-gray-600">
              {uploadedImages.length} imagen{uploadedImages.length !== 1 ? 'es' : ''} subida{uploadedImages.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="relative">
                  <img
                    src={image.delivery_url}
                    alt={image.original_filename}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  
                  {/* Indicador de orden */}
                  <div className="absolute top-1 left-1 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    #{image.order + 1}
                  </div>
                  
                  {/* Indicador de imagen primaria */}
                  {image.is_primary && (
                    <div className="absolute top-1 left-8 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Principal
                    </div>
                  )}
                  
                  {/* Botones de acción */}
                  <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         {!image.is_primary && (
                       <button
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           setPrimaryImage(image.id);
                         }}
                         className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-600"
                         title="Establecer como principal"
                       >
                         ⭐
                       </button>
                     )}
                                         <button
                       onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         deleteImage(image.id);
                       }}
                       className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                       title="Eliminar imagen"
                     >
                       <DeleteOutlined />
                     </button>
                  </div>
                  
                  {/* Indicador de arrastrable */}
                  <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DragOutlined className="text-white text-lg drop-shadow-lg" />
                  </div>
                </div>
                
                {/* Información de la imagen */}
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600 truncate" title={image.original_filename}>
                    {image.original_filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(image.file_size / 1024).toFixed(1)} KB
                  </p>
                  {image.optimization_stats && (
                    <div className="text-xs">
                      <p className="text-green-600 font-medium">
                        -{image.optimization_stats.reduction_percentage}% optimizado
                      </p>
                      {image.original_file_size && (
                        <p className="text-gray-400">
                          {(image.original_file_size / 1024 / 1024).toFixed(1)} MB → {(image.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 