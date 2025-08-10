// Configuración de Cloudflare Images
export const CLOUDFLARE_CONFIG = {
  ACCOUNT_ID: process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID || '0b2f6328acc0b72b183dd4c8ca85038c',
  API_TOKEN: process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN || '1aaIMrrkLZzraqLSown9ej7gLw8QAtEx',
  DELIVERY_URL: process.env.NEXT_PUBLIC_CLOUDFLARE_DELIVERY_URL || 'https://imagedelivery.net/RVD8Hi-5w-BqE-vPVWqcaw',
  API_BASE_URL: 'https://api.cloudflare.com/client/v4'
};

// Funciones de utilidad para Cloudflare Images
export const cloudflareAPI = {
  // Obtener URL de subida directa
  getUploadUrl: async () => {
    const response = await fetch(`${CLOUDFLARE_CONFIG.API_BASE_URL}/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v2/direct_upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_CONFIG.API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {
          uploaded_by: 'admin_panel',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error al obtener URL de subida');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Error en la respuesta de Cloudflare');
    }

    return data.result;
  },

  // Construir URL de entrega
  getDeliveryUrl: (imageId, variant = 'public') => {
    return `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${imageId}/${variant}`;
  },

  // Validar archivo de imagen
  validateImageFile: (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!file) {
      throw new Error('No se seleccionó ningún archivo');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WebP');
    }

    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 50MB permitido (se optimizará automáticamente)');
    }

    return true;
  }
}; 