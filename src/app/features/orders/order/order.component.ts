import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Producto } from '../../../core/interfaces/producto.model';
import { Pedido, PedidoItem } from '../../../core/interfaces/pedido.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BluetoothPrintService } from '../../../core/services/bluetooth-print.service';

@Component({
  selector: 'app-order',
  imports: [CommonModule, FormsModule],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  public btPrintService = inject(BluetoothPrintService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscription: Subscription | null = null;

  isCartOpen = false;
  isLoading = true;
  isEditMode = false;
  orderId: string | null = null;
  originalOrder: Pedido | null = null;
  productos: Producto[] = [];
  filteredItems: Producto[] = [];
  selectedCategory = 'todos';

  // Cart state
  cartItems: PedidoItem[] = [];
  selectedTable = 1;
  isDelivery = false; // false = En Mesa, true = Para Llevar
  orderNumber = '';

  categories = [
    { label: 'Todo', value: 'todos', icon: '🍽️' },
    { label: 'Cafés', value: 'cafe', icon: '☕' },
    { label: 'Tés', value: 'te', icon: '🫖' },
    { label: 'Bebidas', value: 'bebida', icon: '🥤' },
    { label: 'Jugos', value: 'jugo', icon: '🧃' },
    { label: 'Licuados', value: 'licuado', icon: '🥤' },
    { label: 'Sándwiches', value: 'sandwich', icon: '🥪' },
    { label: 'Tostados', value: 'tostado', icon: '🍞' },
    { label: 'Pizzas', value: 'pizza', icon: '🍕' },
    { label: 'Papas', value: 'papas', icon: '🍟' },
    { label: 'Minutas', value: 'minuta', icon: '🍔' },
    { label: 'Facturas', value: 'factura', icon: '🥐' },
    { label: 'Tortas', value: 'torta', icon: '🍰' },
    { label: 'Postres', value: 'postre', icon: '🍨' },
    { label: 'Helados', value: 'helado', icon: '🍦' },
    { label: 'Desayunos', value: 'desayuno', icon: '🍳' },
    { label: 'Meriendas', value: 'merienda', icon: '🥞' }
  ];

  readonly skeletons = Array(8).fill(0);

  ngOnInit(): void {
    this.checkRouteParams();
    this.loadProducts();
  }

  private loadProducts(): void {
    this.subscription = this.firestoreService
      .getCollection<Producto>('productos')
      .subscribe({
        next: (data) => {
          this.productos = data.filter(p => p.disponible);
          this.updateFilteredItems();
          if (!this.isEditMode) {
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Error loading products for order screen:', err);
          this.isLoading = false;
        }
      });
  }

  private checkRouteParams(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.orderId = id;
      this.loadOrderData(id);
    } else {
      this.generateOrderNumber();
    }
  }

  private async loadOrderData(id: string): Promise<void> {
    try {
      this.isLoading = true;
      const order = await this.firestoreService.getDocument<Pedido>('pedidos', id);
      if (order) {
        this.originalOrder = order;
        this.cartItems = order.items.map(item => ({ ...item, comentario: item.comentario || '' }));
        this.orderNumber = order.codigoOrden || String(order.numeroPedido);
        this.isDelivery = !!order.paraLlevar;
        this.selectedTable = order.mesa || 1;
      } else {
        console.error('Pedido no encontrado:', id);
        alert('No se encontró el pedido.');
        this.router.navigate(['/administracion/pedidos']);
      }
    } catch (err) {
      console.error('Error al cargar datos del pedido:', err);
      alert('Error al cargar el pedido.');
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  generateOrderNumber() {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `${yy}${mm}-${random}`;
  }

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.updateFilteredItems();
  }

  updateFilteredItems(): void {
    if (this.selectedCategory === 'todos') {
      this.filteredItems = this.productos;
    } else {
      this.filteredItems = this.productos.filter(p => p.categoria === this.selectedCategory);
    }
  }

  formatPrice(price: any): string {
    const num = Number(price);
    return isNaN(num) ? '$0' : `$${num.toLocaleString('es-AR')}`;
  }

  // Cart Operations
  addToCart(producto: Producto) {
    const existingIndex = this.cartItems.findIndex(item => item.productoId === producto.id);
    if (existingIndex > -1) {
      this.cartItems[existingIndex].cantidad++;
      this.cartItems[existingIndex].subtotal = this.cartItems[existingIndex].cantidad * this.cartItems[existingIndex].precioUnitario;
    } else {
      this.cartItems.push({
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precio,
        subtotal: producto.precio,
        comentario: ''
      });
    }
  }

  increaseQuantity(item: PedidoItem) {
    item.cantidad++;
    item.subtotal = item.cantidad * item.precioUnitario;
  }

  decreaseQuantity(item: PedidoItem) {
    if (item.cantidad > 1) {
      item.cantidad--;
      item.subtotal = item.cantidad * item.precioUnitario;
    } else {
      this.cartItems = this.cartItems.filter(ci => ci.productoId !== item.productoId);
    }
  }

  get cartSubtotal(): number {
    return this.cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }

  get cartTotal(): number {
    return this.cartSubtotal; // Total without IVA as requested
  }

  get totalCartQuantity(): number {
    return this.cartItems.reduce((acc, item) => acc + item.cantidad, 0);
  }

  async confirmarPedido() {
    if (this.cartItems.length === 0) {
      return;
    }

    try {
      this.isLoading = true;
      if (this.isEditMode && this.orderId) {
        await this.firestoreService.updateDocument<Pedido>('pedidos', this.orderId, {
          items: this.cartItems,
          subtotal: this.cartSubtotal,
          total: this.cartTotal,
          fechaActualizacion: new Date(),
          ...(this.isDelivery ? { paraLlevar: true, mesa: undefined } : { mesa: this.selectedTable, paraLlevar: false })
        });
        alert('¡Pedido actualizado con éxito!');
        this.router.navigate(['/administracion/pedidos']);
      } else {
        const user = this.authService.currentUser();
        const pedidoPayload: Omit<Pedido, 'id'> = {
          numeroPedido: Math.floor(100000 + Math.random() * 900000),
          estado: 'pendiente',
          items: this.cartItems,
          subtotal: this.cartSubtotal,
          total: this.cartTotal,
          metodoPago: 'por cobrar',
          estaPagado: false,
          fechaCreacion: new Date(),
          codigoOrden: this.orderNumber,
          usuarioId: user?.uid,
          usuarioNombre: user ? `${user.nombre} ${user.apellido}`.trim() : undefined,
          ...(this.isDelivery ? { paraLlevar: true } : { mesa: this.selectedTable, paraLlevar: false })
        };

        await this.firestoreService.addDocument('pedidos', pedidoPayload);

        // Imprimir comanda por Bluetooth de forma automática si la impresora está conectada
        if (this.btPrintService.isConnected()) {
          try {
            await this.btPrintService.printPedido({
              ...pedidoPayload,
              items: this.cartItems.map(item => ({
                ...item,
                producto: { id: item.productoId, nombre: item.nombre, precio: item.precioUnitario, categoria: 'todos' }
              })),
              montoTotal: this.cartTotal
            } as any);
          } catch (printErr) {
            console.error('Error al autimprimir comanda Bluetooth:', printErr);
          }
        }

        this.cartItems = [];
        this.generateOrderNumber();
        this.isCartOpen = false;
        alert('¡Pedido confirmado con éxito!');
        this.router.navigate(['/administracion/pedidos']);
      }
    } catch (err) {
      console.error('Error al procesar el pedido:', err);
      alert('Hubo un error al guardar el pedido.');
    } finally {
      this.isLoading = false;
    }
  }

  cancelarPedido() {
    if (this.isEditMode) {
      if (confirm('¿Estás seguro de que deseas descartar los cambios?')) {
        this.router.navigate(['/administracion/pedidos']);
      }
    } else {
      if (this.cartItems.length === 0) return;

      if (confirm('¿Estás seguro de que deseas cancelar el pedido actual?')) {
        this.cartItems = [];
        this.isCartOpen = false;
      }
    }
  }
}
