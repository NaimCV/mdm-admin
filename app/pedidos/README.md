# Gestión de Pedidos - Admin Panel

## Descripción
Este módulo permite a los administradores gestionar todos los pedidos del sistema, incluyendo la visualización de detalles completos en páginas dedicadas.

## Funcionalidades

### Lista de Pedidos (`/pedidos`)
- Vista general de todos los pedidos
- Filtrado por estado
- Actualización rápida del estado del pedido
- Enlace directo a los detalles de cada pedido

### Detalles del Pedido (`/pedidos/[id]`)
- **Información del Cliente**: Nombre, email, teléfono y dirección de envío
- **Productos del Pedido**: Lista detallada con cantidades, precios y opciones seleccionadas
- **Información del Pedido**: Fecha de creación, estado actual y notas
- **Acciones Disponibles**:
  - Cambiar estado del pedido
  - Imprimir pedido
  - Enviar email al cliente (próximamente)
  - Marcar como enviado automáticamente

## Estructura de Archivos

```
pedidos/
├── page.js                    # Lista principal de pedidos
├── [id]/
│   ├── page.js               # Página de detalles del pedido
│   └── page.module.css       # Estilos específicos
└── README.md                 # Este archivo
```

## Estados de Pedidos

- **Pendiente**: Pedido creado, pendiente de confirmación
- **Confirmado**: Pedido confirmado, listo para envío
- **Enviado**: Pedido enviado al cliente
- **Entregado**: Pedido entregado exitosamente
- **Cancelado**: Pedido cancelado

## API Endpoints

- `GET /api/orders` - Obtener todos los pedidos
- `GET /api/orders/{id}` - Obtener pedido específico
- `PUT /api/orders/{id}` - Actualizar pedido
- `DELETE /api/orders/{id}` - Eliminar pedido

## Opciones de Productos

El sistema soporta productos con opciones personalizables que se muestran en los pedidos:

- **Opciones de Selección**: Tallas, colores, materiales, etc.
- **Campos de Texto**: Personalizaciones, mensajes, etc.
- **Opciones Obligatorias**: Campos que el cliente debe completar
- **Almacenamiento**: Las opciones seleccionadas se guardan en `selected_options` como JSON
- **Resolución Automática**: El backend resuelve automáticamente los IDs de opciones a nombres descriptivos

### Ejemplo de Opciones
**En la base de datos:**
```json
{
  "8": "Naim",
  "10": "Amarillo"
}
```

**En la interfaz de administración:**
```
Nombre: Naim
Color: Amarillo
```

### Cómo Funciona
1. **Frontend**: Envía opciones con IDs numéricos como keys
2. **Backend**: Almacena las opciones tal como se reciben
3. **Consulta**: Al recuperar pedidos, resuelve IDs a nombres descriptivos
4. **Visualización**: Muestra nombres legibles en lugar de IDs

## Características Técnicas

- **Responsive Design**: Adaptado para móviles y escritorio
- **Estados de Carga**: Indicadores visuales durante operaciones
- **Manejo de Errores**: Notificaciones para operaciones exitosas/fallidas
- **Navegación**: Breadcrumbs y botones de retorno
- **Impresión**: Estilos optimizados para impresión
- **Opciones de Productos**: Visualización de opciones seleccionadas por el cliente (tallas, colores, personalizaciones, etc.)

## Implementación Técnica

### Resolución de Opciones
El sistema implementa un mecanismo de resolución automática de opciones en el backend:

```python
def _resolve_order_options(self, db: Session, order: Order):
    """Resuelve los IDs de las opciones seleccionadas a sus nombres descriptivos"""
    for item in order.items:
        if item.selected_options:
            resolved_options = {}
            for option_id_str, option_value in item.selected_options.items():
                try:
                    option_id = int(option_id_str)
                    option = db.query(ProductOption).filter(ProductOption.id == option_id).first()
                    if option:
                        resolved_options[option.name] = option_value
                except (ValueError, TypeError):
                    resolved_options[option_id_str] = option_value
            
            item.selected_options = resolved_options
```

### Flujo de Datos
1. **Frontend**: `{ "8": "Naim", "10": "Amarillo" }`
2. **Backend Storage**: Mantiene el formato original
3. **API Response**: `{ "Nombre": "Naim", "Color": "Amarillo" }`
4. **Admin UI**: Muestra nombres legibles

## Sistema de Emails Automáticos

El sistema incluye un servicio completo de notificaciones por email usando **Brevo (Sendinblue)**:

### Tipos de Emails

1. **Confirmación de Pedido** - Para pagos confirmados
2. **Pago Pendiente** - Para transferencias bancarias con instrucciones
3. **Actualización de Estado** - Cuando cambia el estado del pedido

### Características

- **Plantillas HTML Responsivas** - Diseño similar al frontend
- **Envío Automático** - Se ejecuta al crear/actualizar pedidos
- **Personalización** - Incluye datos del pedido y opciones seleccionadas
- **Instrucciones de Pago** - Para transferencias bancarias
- **Verificación de Email** - Botón de confirmación solo para emails no verificados
- **Fallback Seguro** - No falla la operación si falla el email

### Configuración

```bash
# Variables de entorno requeridas
BREVO_API_KEY=tu_api_key_de_brevo
COMPANY_NAME=Nombre de tu Empresa
COMPANY_WEBSITE=https://tuempresa.com
SENDER_EMAIL=noreply@tuempresa.com
SENDER_NAME=Tu Empresa
SUPPORT_EMAIL=soporte@tuempresa.com
```

### Verificación de Emails

El sistema incluye un mecanismo de verificación de emails para confirmar que los clientes reciben los mensajes:

- **Botón de Verificación** - Solo aparece en emails de clientes no verificados
- **Endpoint Público** - `/api/orders/{order_id}/verify-email` para verificación del cliente
- **Estado Visual** - Indicadores en el admin (✅ Verificado / ⏳ Pendiente)
- **Timestamp** - Fecha y hora de verificación
- **Inteligente** - No muestra botones en emails ya verificados

### Pruebas

```bash
cd backend
python test_email_service.py
python test_email_verification.py
```

## Futuras Mejoras

- [x] Sistema de notificaciones por email ✅
- [ ] Historial de cambios de estado
- [ ] Comentarios internos del administrador
- [ ] Seguimiento de envío con números de tracking
- [ ] Exportación a PDF/Excel
- [ ] Filtros avanzados por fecha, cliente, etc.
- [ ] Dashboard con estadísticas de pedidos

## Uso

1. **Acceder a la lista**: Navegar a `/pedidos`
2. **Ver detalles**: Hacer clic en "Ver Detalles" de cualquier pedido
3. **Cambiar estado**: Usar el selector de estado en la página de detalles
4. **Navegar**: Usar el botón "← Volver a Pedidos" para regresar

## Dependencias

- Next.js 13+ con App Router
- React Hooks (useState, useEffect)
- Tailwind CSS para estilos base
- CSS Modules para estilos específicos
- API REST del backend
