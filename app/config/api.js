const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Función para obtener el token de autenticación
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Función para hacer peticiones HTTP
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      
      // Intentar obtener el mensaje de error del backend
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      } catch (parseError) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Funciones para autenticación
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      throw new Error('Credenciales inválidas');
    }
    
    return await response.json();
  },

  register: async (userData) => {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  },
};

// Funciones para productos
export const productsAPI = {
  getAll: async (skip = 0, limit = 100) => {
    return await apiRequest(`/api/admin/products?skip=${skip}&limit=${limit}`);
  },

  getById: async (id) => {
    return await apiRequest(`/api/admin/products/${id}`);
  },

  create: async (productData) => {
    return await apiRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  update: async (id, productData) => {
    return await apiRequest(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },

  toggleStatus: async (id) => {
    return await apiRequest(`/api/products/${id}/toggle-status`, {
      method: 'POST',
    });
  },
};

// Funciones para pedidos
export const ordersAPI = {
  getAll: async (skip = 0, limit = 100) => {
    return await apiRequest(`/api/orders?skip=${skip}&limit=${limit}`);
  },

  getById: async (id) => {
    return await apiRequest(`/api/orders/${id}`);
  },

  create: async (orderData) => {
    return await apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  update: async (id, orderData) => {
    return await apiRequest(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/api/orders/${id}`, {
      method: 'DELETE',
    });
  },

  search: async (query, searchType = 'all', skip = 0, limit = 50) => {
    const params = new URLSearchParams({
      query,
      search_type: searchType,
      skip: skip.toString(),
      limit: limit.toString()
    });
    return await apiRequest(`/api/orders/search?${params}`);
  },
};

// Funciones para pagos y reembolsos
export const paymentsAPI = {
  createRefund: async (refundData) => {
    return await apiRequest('/api/payments/refund', {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
  },

  getRefundStatus: async (orderId) => {
    return await apiRequest(`/api/payments/refund/${orderId}`);
  },
};

// Funciones para estadísticas del admin
export const adminAPI = {
  getStats: async () => {
    return await apiRequest('/api/admin/stats');
  },
};

// Función para subir imágenes
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};

// API de contacto
export const contactAPI = {
  getAll: async () => {
    return await apiRequest('/api/contacts');
  },

  getById: async (id) => {
    return await apiRequest(`/api/contacts/${id}`);
  },

  update: async (id, contactData) => {
    return await apiRequest(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/api/contacts/${id}`, {
      method: 'DELETE',
    });
  },

  getUnreadCount: async () => {
    return await apiRequest('/api/contacts/unread/count');
  },
}; 