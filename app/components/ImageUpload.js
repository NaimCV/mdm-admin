'use client';

import { useState, useEffect } from 'react';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';

export default function ImageUpload({ onImageUploaded, currentImageUrl = '', productId = null }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(currentImageUrl);

  // Actualizar uploadedImageUrl cuando cambie currentImageUrl
  useEffect(() => {
    console.log('ImageUpload - currentImageUrl changed:', currentImageUrl);
    setUploadedImageUrl(currentImageUrl || '');
  }, [currentImageUrl]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen válidos');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 50MB permitido (se optimizará automáticamente)');
      return;
    }

    await uploadToBackend(file);
  };

  const uploadToBackend = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_primary', 'true');

      // Si tenemos productId, usar el endpoint de productos
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const endpoint = productId 
        ? `${baseUrl}/api/products/${productId}/images`
        : `${baseUrl}/api/admin/upload-image`; // Endpoint genérico para admin

      console.log('Subiendo imagen a endpoint:', endpoint);
      console.log('ProductId:', productId);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al subir la imagen');
      }

      const result = await response.json();
      console.log('Respuesta del servidor:', result);
      
      // Extraer la URL de entrega del resultado
      const deliveryUrl = result.delivery_url || result.url;
      
      setUploadedImageUrl(deliveryUrl);
      setUploadProgress(100);
      
      // Notificar al componente padre
      if (onImageUploaded) {
        onImageUploaded(deliveryUrl);
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Error al subir la imagen: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect({ target: { files } });
    }
  };

  return (
    <div className="space-y-4">
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
            <p className="text-sm text-gray-600">Subiendo imagen...</p>
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
                Arrastra y suelta una imagen aquí, o{' '}
                <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                  selecciona un archivo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF hasta 50MB (se optimizará automáticamente)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Vista previa de imagen */}
      {uploadedImageUrl ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <CheckCircleOutlined className="text-green-600" />
            <span className="text-sm text-gray-600">Imagen subida exitosamente</span>
          </div>
          <div className="relative">
            <img
              src={uploadedImageUrl}
              alt="Vista previa"
              className="w-full h-32 object-cover rounded-lg border"
            />
            <button
              onClick={() => {
                setUploadedImageUrl('');
                if (onImageUploaded) onImageUploaded('');
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
          <input
            type="text"
            value={uploadedImageUrl}
            readOnly
            className="w-full text-xs text-gray-500 bg-gray-100 p-2 rounded border"
            placeholder="URL de la imagen"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">No hay imagen seleccionada</span>
          </div>
          <div className="h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Sin imagen</span>
          </div>
        </div>
      )}
    </div>
  );
} 