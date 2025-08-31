'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsAPI, apiRequest } from '../../../config/api';
import { useNotification } from '../../../hooks/useNotification';
import Notification from '../../../components/Notification';
import ImageUpload from '../../../components/ImageUpload';
import BackendImageUpload from '../../../components/BackendImageUpload';
import TipTapEditor from '../../../components/TipTapEditor';
import ProductOptionsManager from '../../../components/ProductOptionsManager';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  DeleteOutlined,
  LoadingOutlined
} from '@ant-design/icons';

export default function EditarProducto() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    image_url: '',
    show_without_stock: false,  // Nuevo campo
    // Campos para cálculo de precio
    dimensions_length: '',
    dimensions_width: '',
    dimensions_height: '',
    weight: '',
    production_cost: '',
    profit_margin: '30.0',  // Valor por defecto del 30%
    shipping_cost: ''
  });
  const [categories, setCategories] = useState([]);
  const [productImages, setProductImages] = useState([]);
  
  const { notifications, showSuccess, showError, removeNotification } = useNotification();

  useEffect(() => {
    if (params.id) {
      loadProduct();
      loadCategories();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getById(params.id);
      setProduct(data);
      setFormData({
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        stock: data.stock.toString(),
        category_id: data.category_id ? data.category_id.toString() : '',
        image_url: data.image_url || '',
        show_without_stock: data.show_without_stock || false, // Cargar el nuevo campo
        // Campos para cálculo de precio
        dimensions_length: data.dimensions_length ? data.dimensions_length.toString() : '',
        dimensions_width: data.dimensions_width ? data.dimensions_width.toString() : '',
        dimensions_height: data.dimensions_height ? data.dimensions_height.toString() : '',
        weight: data.weight ? data.weight.toString() : '',
        production_cost: data.production_cost ? data.production_cost.toString() : '',
        profit_margin: data.profit_margin ? data.profit_margin.toString() : '30.0',
        shipping_cost: data.shipping_cost ? data.shipping_cost.toString() : ''
      });
      
      // Cargar imágenes múltiples del producto
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products/${params.id}/images`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        
        if (response.ok) {
          const images = await response.json();
          setProductImages(images);
        } else {
          setProductImages([]);
        }
      } catch (imageError) {
        console.error('Error cargando imágenes del producto:', imageError);
        setProductImages([]);
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
      showError('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si cambian los campos de costes, recalcular el precio automáticamente
    if (['production_cost', 'profit_margin', 'shipping_cost'].includes(name)) {
      const newFormData = { ...formData, [name]: value };
      const calculatedPrice = calculateRecommendedPrice(newFormData);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        price: calculatedPrice.toFixed(2)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const productData = {
        ...formData,
        // NO enviar el precio - el backend lo calculará automáticamente
        // price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        show_without_stock: formData.show_without_stock,
        // Campos para cálculo de precio
        dimensions_length: formData.dimensions_length ? parseFloat(formData.dimensions_length) : null,
        dimensions_width: formData.dimensions_width ? parseFloat(formData.dimensions_width) : null,
        dimensions_height: formData.dimensions_height ? parseFloat(formData.dimensions_height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        production_cost: formData.production_cost ? parseFloat(formData.production_cost) : null,
        profit_margin: formData.profit_margin ? parseFloat(formData.profit_margin) : 30.0,
        shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : null
      };

      await productsAPI.update(params.id, productData);
      showSuccess('Producto actualizado exitosamente');
      
      // Redirigir a la lista de productos
      router.push('/productos');
    } catch (error) {
      console.error('Error:', error);
      showError('Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setSaving(true);
      await productsAPI.delete(params.id);
      showSuccess('Producto eliminado exitosamente');
      router.push('/productos');
    } catch (error) {
      console.error('Error:', error);
      showError('Error al eliminar el producto');
    } finally {
      setSaving(false);
    }
  };

  const roundUsingTaxes = (priceWithoutTaxes, tax = 0.21) => {
    // Ajusta el precio base para que el precio final con impuestos termine en .00 o .05
    priceWithoutTaxes = Math.round(priceWithoutTaxes * 100) / 100;
    const price = priceWithoutTaxes * (1 + tax);
    const lastDecimalDigit = price.toFixed(2).slice(-1);
    
    if (lastDecimalDigit === "0" || lastDecimalDigit === "5") {
      return priceWithoutTaxes;
    }
    
    return roundUsingTaxes(priceWithoutTaxes + 0.01, tax);
  };

  const calculateRecommendedPrice = (data = formData) => {
    const cost = parseFloat(data.production_cost || 0) + parseFloat(data.shipping_cost || 0);
    const margin = parseFloat(data.profit_margin || 30.0);
    const basePrice = cost * (1 + margin / 100);
    
    // Aplicar la misma lógica de redondeo que el backend
    const adjustedBasePrice = roundUsingTaxes(basePrice, 0.21);
    return adjustedBasePrice;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <LoadingOutlined className="text-4xl text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Producto no encontrado</p>
            <button
              onClick={() => router.push('/productos')}
              className="btn-primary"
            >
              Volver a Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <button
                onClick={() => router.push('/productos')}
                className="flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeftOutlined className="mr-2" />
                Volver a Productos
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Editar Producto: {product.name}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <DeleteOutlined className="mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio * (se calcula automáticamente)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <p>💰 Precio base (sin IVA): {formData.price}€</p>
                  <p>🧮 Precio con IVA (21%): {product?.price_with_iva ? product.price_with_iva.toFixed(2) : (parseFloat(formData.price || 0) * 1.21).toFixed(2)}€</p>
                  <p>✅ El precio con IVA termina en .00 o .05</p>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  El precio se calcula automáticamente basándose en el coste de producción, margen de beneficio y coste de envío
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock *
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Checkbox para mostrar sin stock */}
            <div className="mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_without_stock}
                  onChange={(e) => setFormData({...formData, show_without_stock: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Mostrar como "en stock" en el frontend aunque no tenga stock real
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Útil para productos que se pueden pedir bajo demanda o que tienen stock ilimitado
              </p>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <TipTapEditor
                value={formData.description}
                onChange={(value) => setFormData({...formData, description: value})}
                placeholder="Describe tu producto aquí..."
              />
            </div>
          </div>

          {/* Información de Medidas y Costes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Medidas, Peso y Costes</h2>
            <p className="text-sm text-gray-600 mb-6">
              Esta información te ayudará a calcular mejor el precio de venta y los costes de envío
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="dimensions_length"
                  value={formData.dimensions_length || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ancho (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="dimensions_width"
                  value={formData.dimensions_width || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alto (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="dimensions_height"
                  value={formData.dimensions_height || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coste de Producción (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="production_cost"
                    value={formData.production_cost || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margen de Beneficio (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="500"
                    name="profit_margin"
                    value={formData.profit_margin || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30.0"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Porcentaje de beneficio sobre el coste total (ej: 30% = 0.30)
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costes de Envío Estimados (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="shipping_cost"
                    value={formData.shipping_cost || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Precio Recomendado Calculado */}
                {formData.production_cost && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900 mb-2">💰 Precio Recomendado Calculado</h3>
                    <div className="text-lg font-semibold text-green-700">
                      €{calculateRecommendedPrice().toFixed(2)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Coste: €{formData.production_cost} + Envío: €{formData.shipping_cost || 0} + Margen: {formData.profit_margin || 30.0}%
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Consejo para el Precio</h3>
                  <p className="text-sm text-blue-700">
                    Precio recomendado = (Coste de producción + Costes de envío) × (1 + Margen% / 100)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ejemplo: Coste €10 + Envío €2 + Margen 30% = Precio €15.60
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Opciones del Producto */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Opciones del Producto</h2>
            <ProductOptionsManager 
              productId={params.id}
              onOptionsChange={(options) => {
                console.log('Opciones actualizadas:', options);
              }}
            />
          </div>

          {/* Galería de Imágenes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Galería de Imágenes</h2>
            <BackendImageUpload
              key={`product-images-${params.id}-${productImages.length}`}
              productId={params.id}
              currentImages={productImages}
              isMultiple={true}
              onImageUploaded={(newImages) => {
                if (Array.isArray(newImages)) {
                  setProductImages(prev => [...prev, ...newImages]);
                } else {
                  setProductImages(prev => [...prev, newImages]);
                }
              }}
              onImageDeleted={(imageId) => {
                setProductImages(prev => prev.filter(img => img.id !== imageId));
              }}
              onImagePrimaryChanged={(updatedImages) => {
                setProductImages(updatedImages);
              }}
            />
          </div>

          {/* Botones de Acción */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/productos')}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <LoadingOutlined className="mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <SaveOutlined className="mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
} 