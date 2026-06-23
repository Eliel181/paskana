import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Subscription } from 'rxjs';
import { Pedido } from '../../../core/interfaces/pedido.model';
import { MyOrdersComponent } from '../my-orders/my-orders.component';
import { FormsModule } from '@angular/forms';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Configurar fuentes virtuales de pdfmake
(pdfMake as any).vfs = pdfFonts && pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : (pdfMake as any).vfs;

@Component({
  selector: 'app-all-orders',
  imports: [MyOrdersComponent, FormsModule],
  templateUrl: './all-orders.component.html',
  styleUrl: './all-orders.component.css'
})
export class AllOrdersComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private subscription: Subscription | null = null;

  isLoading = true;
  allOrders: Pedido[] = [];
  orders: Pedido[] = [];
  activeTab: 'pedidos' | 'mis-pedidos' = 'pedidos';

  // Date Slider State
  selectedDate: Date = new Date();
  dateSliderItems: Date[] = [];

  // Accordion State
  expandedOrderId: string | null = null;

  // Print State
  orderToPrint: Pedido | null = null;

  // Management Modal State
  orderToManage: Pedido | null = null;
  editEstado: any = 'pendiente';
  editEstaPagado: boolean = false;
  editMetodoPago: any = 'por cobrar';

  ngOnInit(): void {
    this.generateDateSlider();
    this.subscription = this.firestoreService
      .getCollection<Pedido>('pedidos')
      .subscribe({
        next: (data) => {
          this.allOrders = data;
          this.filterOrders();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar pedidos:', err);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // Generate date items for the horizontal slider (centered on selectedDate)
  generateDateSlider() {
    const items: Date[] = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() + i);
      items.push(d);
    }
    this.dateSliderItems = items;
  }

  selectDate(date: Date) {
    this.selectedDate = new Date(date);
    this.generateDateSlider();
    this.filterOrders();
  }

  previousDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    this.selectDate(newDate);
  }

  nextDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    this.selectDate(newDate);
  }

  getDayName(date: Date): string {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    if (this.isSameDay(date, today)) {
      return 'Hoy';
    }
    return days[date.getDay()];
  }

  formatDateForInput(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onDateChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.value) {
      const parts = target.value.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      this.selectDate(new Date(year, month, day));
    }
  }

  filterOrders(): void {
    this.orders = this.allOrders
      .filter(o => this.isSameDay(o.fechaCreacion, this.selectedDate))
      .sort((a, b) => {
        const dateA = this.getJsDate(a.fechaCreacion).getTime();
        const dateB = this.getJsDate(b.fechaCreacion).getTime();
        return dateB - dateA; // Sort newest first
      });
  }

  isSameDay(date1: any, date2: Date): boolean {
    if (!date1) return false;
    const d = this.getJsDate(date1);
    return d.getDate() === date2.getDate() &&
           d.getMonth() === date2.getMonth() &&
           d.getFullYear() === date2.getFullYear();
  }

  // Set active tab
  setActiveTab(tab: 'pedidos' | 'mis-pedidos') {
    this.activeTab = tab;
  }

  // Accordion Toggle
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

  // Actions
  imprimirTicket(order: Pedido) {
    const heightEstimate = 160 + order.items.length * 15 + (order.observaciones ? 25 : 0);
    const docDefinition: any = {
      pageSize: {
        width: 164, // 58mm en puntos
        height: heightEstimate
      },
      pageMargins: [6, 8, 6, 8],
      content: [
        { text: 'PASKANA', fontSize: 13, bold: true, alignment: 'center', margin: [0, 0, 0, 1] },
        { text: 'Café & Delicias', fontSize: 8, alignment: 'center', margin: [0, 0, 0, 2] },
        { text: '================================', fontSize: 7, alignment: 'center', margin: [0, 0, 0, 4] },
        
        { text: `Ticket #${order.codigoOrden || order.numeroPedido}`, fontSize: 9, bold: true, margin: [0, 0, 0, 2] },
        { text: `Fecha: ${this.formatTime(order.fechaCreacion)}`, fontSize: 7, margin: [0, 0, 0, 2] },
        { text: `Servicio: ${order.paraLlevar ? 'Para Llevar' : 'Mesa ' + order.mesa}`, fontSize: 7, margin: [0, 0, 0, 4] },
        { text: '================================', fontSize: 7, alignment: 'center', margin: [0, 0, 0, 4] },
        
        {
          table: {
            widths: ['*', 'auto'],
            body: order.items.map(item => [
              { text: `${item.cantidad}x ${item.nombre}`, fontSize: 7, margin: [0, 1, 0, 1] },
              { text: this.formatPrice(item.subtotal), fontSize: 7, alignment: 'right', margin: [0, 1, 0, 1] }
            ])
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 4]
        },
        
        { text: '================================', fontSize: 7, alignment: 'center', margin: [0, 0, 0, 4] },
        
        {
          columns: [
            { text: 'TOTAL:', fontSize: 8, bold: true },
            { text: this.formatPrice(order.total), fontSize: 8, bold: true, alignment: 'right' }
          ],
          margin: [0, 2, 0, 4]
        },
        
        { text: '================================', fontSize: 7, alignment: 'center', margin: [0, 2, 0, 4] },
        { text: '¡Gracias por tu visita!', fontSize: 8, bold: true, alignment: 'center', margin: [0, 1, 0, 1] },
        { text: 'Paskana - Control de Comandas', fontSize: 6, alignment: 'center', margin: [0, 1, 0, 0] }
      ]
    };

    pdfMake.createPdf(docDefinition).open();
  }

  gestionarPedido(order: Pedido) {
    this.orderToManage = order;
    this.editEstado = order.estado;
    this.editEstaPagado = !!order.estaPagado;
    this.editMetodoPago = order.metodoPago || 'por cobrar';
  }

  async guardarGestionPedido() {
    if (!this.orderToManage) return;
    try {
      await this.firestoreService.updateDocument('pedidos', this.orderToManage.id, {
        estado: this.editEstado,
        estaPagado: this.editEstaPagado,
        metodoPago: this.editMetodoPago,
        fechaActualizacion: new Date()
      });
      this.orderToManage = null;
    } catch (err) {
      console.error('Error al actualizar pedido:', err);
      alert('Error al actualizar el pedido');
    }
  }

  // Dashboard Stats Getters (filters only the selected date's active orders)
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
