# Bitácora de Pedido - Paskana

Esta bitácora documenta el flujo completo paso a paso para la gestión, almacenamiento y visualización de pedidos en la aplicación, sirviendo como guía de contexto para el funcionamiento actual y futuros desarrollos.

---

## 1. Flujo de Negocio para Crear y Guardar un Pedido

El proceso de creación de un pedido consta de 6 fases dentro del componente `OrderComponent`:

### Paso 1: Carga de Productos y Categorías
- Al inicializar el componente (`ngOnInit`), se consulta la colección `productos` en Firestore de forma reactiva (a través de `FirestoreService.getCollection<Producto>('productos')`).
- Se filtran los productos recuperados de manera que **únicamente aquellos con la propiedad `disponible: true` sean visibles** en la interfaz.
- Mientras se resuelve la petición, se renderiza una grilla animada de carga (*skeletons*).
- Se genera un código identificador temporal para el pedido actual mediante el método `generateOrderNumber()`, siguiendo el formato `AAMM-XXXX` (donde `AA` es el año, `MM` el mes y `XXXX` un número aleatorio de 4 dígitos).

### Paso 2: Selección y Filtrado
- El usuario puede navegar por las pestañas de categorías superiores (Todo, Cafés, Tés, Bebidas, Postres).
- Al pulsar una pestaña, se actualiza `selectedCategory` y la propiedad computada `filteredItems` filtra dinámicamente el listado basándose en la propiedad `categoria` de cada producto.

### Paso 3: Agregar Productos al Carrito
- Toda la tarjeta del producto es interactiva. Al hacer clic en cualquier parte de una tarjeta:
  1. Se ejecuta `addToCart(producto)`.
  2. El método verifica si el producto ya existe en la lista de items del carrito (`cartItems`).
  3. Si ya existe, incrementa la cantidad (`cantidad++`) y actualiza el subtotal de esa línea (`subtotal = cantidad * precioUnitario`).
  4. Si es nuevo, añade un objeto que cumple con la estructura de la interfaz `PedidoItem`.
- Adicionalmente, en la vista móvil, al agregar productos se incrementa el contador de la burbuja sobre el botón flotante (FAB).

### Paso 4: Ajustar Detalles del Pedido (Mesa / Modalidad)
- El usuario define la modalidad en el selector superior:
  - **En Mesa**: Muestra el panel para seleccionar el número de mesa (del 1 al 8) y almacena `selectedTable` en el componente.
  - **Para Llevar**: Oculta el selector de mesa y almacena el pedido con la propiedad `paraLlevar = true`.
- Dentro de la barra lateral (o el *drawer* móvil), el usuario puede incrementar (`increaseQuantity`) o reducir (`decreaseQuantity`) cantidades directamente. Si la cantidad de un item baja a 0, se elimina automáticamente del carrito.

### Paso 5: Cálculo Financiero (Sin IVA)
- Se calculan el subtotal y el total de forma computada (getters `cartSubtotal` y `cartTotal`).
- Conforme a los requisitos actuales del negocio, **se ha omitido la visualización y el cobro del IVA**, por lo que:
  $$\text{Total} = \text{Subtotal} = \sum (\text{cantidad} \times \text{precioUnitario})$$

### Paso 6: Confirmación y Envío a Firestore
- Al presionar **"Confirmar Pedido"**, se ejecuta el método asíncrono `confirmarPedido()`.
- Se obtiene la información del usuario autenticado actual desde el servicio `AuthService`.
- Se estructura el payload final del pedido cumpliendo con la interfaz `Pedido`:
  - `numeroPedido`: Un número numérico aleatorio de 6 dígitos.
  - `estado`: Inicializado en `'pendiente'`.
  - `items`: La colección de items del carrito (`cartItems`).
  - `subtotal` y `total`: Valores calculados.
  - `metodoPago`: Ajustado por defecto en `'por cobrar'`.
  - `estaPagado`: Inicializado en `false` por defecto.
  - `fechaCreacion`: Fecha y hora actual (`new Date()`).
  - `mesa`: El número de mesa si no es para llevar, o `undefined` si es para llevar.
  - `paraLlevar`: Indicador booleano basado en la modalidad.
  - `codigoOrden`: Código alfanumérico generado en el paso 1.
  - `usuarioId`: El identificador de usuario (`uid`) de quien registra el pedido en el sistema.
  - `usuarioNombre`: El nombre completo del usuario concatenado (`nombre + apellido`).
- Se hace la llamada asíncrona: `await this.firestoreService.addDocument('pedidos', pedidoPayload)`.
- **Acciones tras el éxito:**
  1. El carrito (`cartItems`) se vacía completamente.
  2. Se genera un nuevo código identificador para el siguiente pedido.
  3. Se cierra el panel móvil (si estaba abierto).
  4. Se muestra una alerta nativa de confirmación exitosa.

---

## 3. Visualización y Control de Pedidos del Día

La visualización de las comandas activas y el historial de ventas del día se administra a través del componente `AllOrdersComponent` (`/administracion/pedidos`), el cual se organiza mediante pestañas:

### A. Pestaña "Pedidos" (General)
- Muestra una sección de estadísticas en tiempo real con 3 métricas:
  1. **Ventas de Hoy**: Sumatoria total de los pedidos completados y pendientes (excluyendo cancelados).
  2. **Pedidos Activos**: Cantidad total de comandas en estados `'pendiente'`, `'en_preparacion'` o `'listo'`.
  3. **Listos para Despacho**: Cantidad de pedidos listos que están pendientes de ser entregados al cliente.
- Lista todos los pedidos de la colección `pedidos` en Firestore que correspondan a la fecha del día actual (`isToday`).
- Los pedidos se visualizan en formato de tarjeta estructurada, ordenados cronológicamente de más reciente a más antiguo, mostrando items, precio unitario, método de pago, mesa, cajero/mozo que registró y estado de pago (`estaPagado`).

### B. Pestaña "Mis Pedidos" (Personal)
- Al ser seleccionada, renderiza el componente secundario `<app-my-orders>`.
- Este componente consulta la colección `pedidos` y filtra automáticamente por:
  1. El `uid` del usuario actualmente logueado (`usuarioId === currentUser.uid`).
  2. La fecha actual (únicamente pedidos creados hoy).
- Muestra las tarjetas de comanda asociadas directamente a las ventas o atenciones del empleado en su turno activo.

---

## 4. Definición de Estructuras e Interfaces Utilizadas

### Pedido (`pedido.model.ts`)
```typescript
export interface Pedido {
    id: string;
    numeroPedido: number;
    usuarioId?: string;   // el id del currentUser que esta haciendo el pedido
    usuarioNombre?: string;
    estado: EstadoPedido;
    items: PedidoItem[];
    subtotal: number;
    descuento?: number;
    total: number;
    metodoPago: MetodoPago;
    observaciones?: string;
    mesa?: number;
    paraLlevar?: boolean;
    estaPagado?: boolean;
    codigoOrden?: string;
    fechaCreacion: Date;
    fechaActualizacion?: Date;
}
```

### PedidoItem (`pedido.model.ts`)
```typescript
export interface PedidoItem {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}
```

### Tipos Auxiliares
- **`EstadoPedido`**: `'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado'`
- **`MetodoPago`**: `'por cobrar' | 'efectivo' | 'debito' | 'credito' | 'transferencia'`
