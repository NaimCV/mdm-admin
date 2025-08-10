'use client';

import { useState } from 'react';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { cloudflareAPI } from '../config/cloudflare';

export default function MultipleImageUpload({ onImagesUploaded, currentImages = [] }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState(currentImages);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validar cada archivo
    for (const file of files) {
      try {
        cloudflareAPI.validateImageFile(file);
      } catch (error) {
        alert(`Error en ${file.name}: ${error.message}`);
        return;
      }
    }

    await uploadMultipleImages(files);
  };

  const uploadMultipleImages = async (files) => {
    setUploading(true);
    setUploadProgress(0);

    const newImages = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Actualizar progreso
        setUploadProgress((i / totalFiles) * 100);

        // Obtener URL de subida
        const uploadData = await cloudflareAPI.getUploadUrl();
        const { uploadURL, id: imageId } = uploadData;

        // Subir imagen
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch(uploadURL, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Error al subir ${file.name}`);
        }

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          throw new Error(uploadResult.errors?.[0]?.message || `Error al procesar ${file.name}`);
        }

        // Construir URL de entrega
        const deliveryUrl = cloudflareAPI.getDeliveryUrl(imageId, 'public');
        newImages.push(deliveryUrl);
      }

      // Actualizar estado
      const updatedImages = [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
      setUploadProgress(100);

      // Notificar al componente padre
      if (onImagesUploaded) {
        onImagesUploaded(updatedImages);
      }

    } catch (error) {
      console.error('Error uploading images:', error);
      alert(`Error al subir las imágenes: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (index) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);
    
    if (onImagesUploaded) {
      onImagesUploaded(updatedImages);
    }
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
            <p className="text-sm text-gray-600">Subiendo imágenes...</p>
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
                Arrastra y suelta imágenes aquí, o{' '}
                <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                  selecciona archivos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF hasta 10MB cada una
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
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <DeleteOutlined />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 