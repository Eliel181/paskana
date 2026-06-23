import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Subscription } from 'rxjs';
import { Pedido } from '../../../core/interfaces/pedido.model';
import { MyOrdersComponent } from '../my-orders/my-orders.component';

@Component({
  selector: 'app-all-orders',
  imports: [MyOrdersComponent],
  templateUrl: './all-orders.component.html',
  styleUrl: './all-orders.component.css'
})
export class AllOrdersComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private subscription: Subscription | null = null;

  isLoading = true;
  orders: Pedido[] = [];
  activeTab: 'pedidos' | 'mis-pedidos' = 'pedidos';

  ngOnInit(): void {
    this.subscription = this.firestoreService
      .getCollection<Pedido>('pedidos')
      .subscribe({
        next: (data) => {
          // Filter by today's date
          this.orders = data
            .filter(o => this.isToday(o.fechaCreacion))
            .sort((a, b) => {
              const dateA = this.getJsDate(a.fechaCreacion).getTime();
              const dateB = this.getJsDate(b.fechaCreacion).getTime();
              return dateB - dateA;
            });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar pedidos del día:', err);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // Set active tab
  setActiveTab(tab: 'pedidos' | 'mis-pedidos') {
    this.activeTab = tab;
  }

  // Dashboard Stats Getters
  get totalSales(): number {
    return this.orders
      .filter(o => o.estado !== 'cancelado')
      .reduce((sum, o) => sum + o.total, 0);
  }

  get activeOrdersCount(): number {
    return this.orders.filter(o => ['pendiente', 'en_preparacion', 'listo'].includes(o.estado)).length;
  }

  get readyOrdersCount(): number {
    return this.orders.filter(o => o.estado === 'listo').length;
  }

  isToday(dateInput: any): boolean {
    if (!dateInput) return false;
    const d = this.getJsDate(dateInput);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
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
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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
