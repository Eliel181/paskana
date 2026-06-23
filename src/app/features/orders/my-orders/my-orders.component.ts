import { Component, OnDestroy, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { Pedido } from '../../../core/interfaces/pedido.model';

@Component({
  selector: 'app-my-orders',
  imports: [],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.css'
})
export class MyOrdersComponent implements OnInit, OnDestroy, OnChanges {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private subscription: Subscription | null = null;

  @Input() selectedDate: Date = new Date();
  @Output() printOrder = new EventEmitter<Pedido>();
  @Output() manageOrder = new EventEmitter<Pedido>();

  isLoading = true;
  allOrders: Pedido[] = [];
  orders: Pedido[] = [];
  expandedOrderId: string | null = null;

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.isLoading = false;
      return;
    }

    this.subscription = this.firestoreService
      .getCollection<Pedido>('pedidos')
      .subscribe({
        next: (data) => {
          this.allOrders = data;
          this.filterOrders();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar mis pedidos:', err);
          this.isLoading = false;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDate'] && !changes['selectedDate'].firstChange) {
      this.filterOrders();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  filterOrders(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.orders = [];
      return;
    }

    this.orders = this.allOrders
      .filter(o => o.usuarioId === currentUser.uid && this.isSameDay(o.fechaCreacion, this.selectedDate))
      .sort((a, b) => {
        const dateA = this.getJsDate(a.fechaCreacion).getTime();
        const dateB = this.getJsDate(b.fechaCreacion).getTime();
        return dateB - dateA; // Sort newest first
      });
  }

  isSameDay(dateInput: any, targetDate: Date): boolean {
    if (!dateInput) return false;
    const d = this.getJsDate(dateInput);
    return d.getDate() === targetDate.getDate() &&
           d.getMonth() === targetDate.getMonth() &&
           d.getFullYear() === targetDate.getFullYear();
  }

  toggleOrderExpansion(orderId: string): void {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
    } else {
      this.expandedOrderId = orderId;
    }
  }

  isOrderExpanded(orderId: string): boolean {
    return this.expandedOrderId === orderId;
  }

  getJsDate(dateInput: any): Date {
    if (!dateInput) return new Date();
    if (typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    } else if (dateInput instanceof Date) {
      return dateInput;
    } else if (dateInput.seconds) {
      return new Date(dateInput.seconds * 1000);
    } else {
      return new Date(dateInput);
    }
  }

  formatPrice(price: any): string {
    const num = Number(price);
    return isNaN(num) ? '$0' : `$${num.toLocaleString('es-AR')}`;
  }

  formatTime(dateInput: any): string {
    const d = this.getJsDate(dateInput);
    const today = new Date();
    const isToday = d.getDate() === today.getDate() &&
                    d.getMonth() === today.getMonth() &&
                    d.getFullYear() === today.getFullYear();
    
    const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';
    if (isToday) {
      return timeStr;
    } else {
      const dateStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      return `${dateStr} - ${timeStr}`;
    }
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'bg-amber-100/80 text-amber-800 border-amber-200/50';
      case 'en_preparacion':
        return 'bg-blue-100/80 text-blue-800 border-blue-200/50';
      case 'listo':
        return 'bg-emerald-100/80 text-emerald-800 border-emerald-200/50';
      case 'entregado':
        return 'bg-gray-100/80 text-gray-700 border-gray-200/50';
      case 'cancelado':
        return 'bg-red-100/80 text-red-800 border-red-200/50';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}
