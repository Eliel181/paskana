import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { Producto } from '../../../core/interfaces/producto.model';
import { Pedido, PedidoItem } from '../../../core/interfaces/pedido.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order',
  imports: [CommonModule],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private subscription: Subscription | null = null;

  isCartOpen = false;
  isLoading = true;
  productos: Producto[] = [];
  selectedCategory = 'todos';

  // Cart state
  cartItems: PedidoItem[] = [];
  selectedTable = 1;
  isDelivery = false; // false = En Mesa, true = Para Llevar
  orderNumber = '';

  categories = [
    { label: 'Todo', value: 'todos' },
    { label: 'Cafés', value: 'cafe' },
    { label: 'Tés', value: 'te' },
    { label: 'Bebidas', value: 'bebida' },
    { label: 'Postres', value: 'postre' }
  ];

  readonly skeletons = Array(8).fill(0);

  ngOnInit(): void {
    this.generateOrderNumber();
    this.subscription = this.firestoreService
      .getCollection<Producto>('productos')
      .subscribe({
        next: (data) => {
          this.productos = data.filter(p => p.disponible);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading products for order screen:', err);
          this.isLoading = false;
        }
      });
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

  get filteredItems(): Producto[] {
    if (this.selectedCategory === 'todos') return this.productos;
    return this.productos.filter(p => p.categoria === this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
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
        subtotal: producto.precio
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

      this.cartItems = [];
      this.generateOrderNumber();
      this.isCartOpen = false;
      alert('¡Pedido confirmado con éxito!');
    } catch (err) {
      console.error('Error al confirmar el pedido:', err);
      alert('Hubo un error al confirmar el pedido.');
    } finally {
      this.isLoading = false;
    }
  }

  cancelarPedido() {
    if (this.cartItems.length === 0) return;

    if (confirm('¿Estás seguro de que deseas cancelar el pedido actual?')) {
      this.cartItems = [];
      this.isCartOpen = false;
    }
  }
}
