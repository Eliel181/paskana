import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Pedido } from '../../../core/interfaces/pedido.model';
import { MyOrdersComponent } from '../my-orders/my-orders.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { BluetoothPrinterModalComponent } from '../bluetooth-printer-modal/bluetooth-printer-modal.component';
import { BluetoothPrintService } from '../../../core/services/bluetooth-print.service';

// Configurar fuentes virtuales de pdfmake
pdfMake.vfs = pdfFonts && pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfMake.vfs;

@Component({
  selector: 'app-all-orders',
  imports: [CommonModule, MyOrdersComponent, FormsModule, BluetoothPrinterModalComponent],
  templateUrl: './all-orders.component.html',
  styleUrl: './all-orders.component.css'
})
export class AllOrdersComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  public btPrintService = inject(BluetoothPrintService);
  private router = inject(Router);
  private subscription: Subscription | null = null;

  isLoading = true;
  allOrders: Pedido[] = [];
  orders: Pedido[] = [];
  activeTab: 'pedidos' | 'mis-pedidos' = 'pedidos';

  // Bluetooth Modal State
  isBtModalOpen = false;

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
    // Calcular altura estimada dinámicamente para evitar saltos de página en tickets de 58mm
    let dynamicHeight = 160; // Base estática (márgenes + encabezado + usuario + totales + leyenda + pie)
    
    // En 58mm (ancho ~164pt / printable ~148pt), estimamos unos 26 caracteres por línea con fuente 8
    order.items.forEach(item => {
      const text = `${item.cantidad}x ${item.nombre}`;
      const lines = Math.max(1, Math.ceil(text.length / 26));
      dynamicHeight += lines * 11;
      if (item.comentario && item.comentario.trim()) {
        const commentLines = Math.max(1, Math.ceil(item.comentario.trim().length / 24));
        dynamicHeight += commentLines * 10;
      }
    });

    // Si hay observaciones, agregamos el espacio correspondiente para el bloque
    if (order.observaciones) {
      const obsLines = Math.max(1, Math.ceil(order.observaciones.length / 26));
      dynamicHeight += obsLines * 11 + 15;
    }
    
    const heightEstimate = dynamicHeight + 25; // Margen de seguridad para evitar saltos accidentales

    const separator = '==================================';

    const docDefinition: any = {
      pageSize: {
        width: 164, // 58mm en puntos (58 * 72 / 25.4 ≈ 164.4)
        height: heightEstimate
      },
      pageMargins: [8, 8, 8, 8],
      content: [
        { text: 'PASKANA', fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 1] },
        { text: 'Café & Delicias', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 2] },
        { text: separator, fontSize: 7, alignment: 'center', margin: [0, 0, 0, 4] },
        
        { text: `Ticket #${order.codigoOrden || order.numeroPedido}`, fontSize: 10, bold: true, margin: [0, 0, 0, 2] },
        { text: `Hora: ${this.formatOnlyTime(order.fechaCreacion)}`, fontSize: 8, margin: [0, 0, 0, 2] },
        { text: `Servicio: ${order.paraLlevar ? 'Para Llevar' : 'Mesa ' + order.mesa}`, fontSize: 8, margin: [0, 0, 0, 2] },
        ...(order.usuarioNombre ? [{ text: `Atendido por: ${order.usuarioNombre}`, fontSize: 8, margin: [0, 0, 0, 4] }] : []),
        { text: separator, fontSize: 7, alignment: 'center', margin: [0, 0, 0, 4] },
        
        {
          table: {
            widths: ['*', 'auto'],
            body: order.items.map(item => [
              {
                text: [
                  { text: `${item.cantidad}x ${item.nombre}`, bold: true },
                  ...(item.comentario && item.comentario.trim() ? [{ text: `\n  (${item.comentario.trim()})`, fontSize: 7, italics: true, bold: false }] : [])
                ],
                fontSize: 8
              },
              { text: this.formatPrice(item.subtotal), fontSize: 8, alignment: 'right' }
            ])
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 1.5,
            paddingBottom: () => 1.5
          },
          margin: [0, 0, 0, 4]
        },

        ...(order.observaciones ? [
          { text: separator, fontSize: 7, alignment: 'center', margin: [0, 0, 0, 4] },
          { text: `Obs: ${order.observaciones}`, fontSize: 8, bold: true, margin: [0, 0, 0, 4] }
        ] : []),
        
        { text: separator, fontSize: 7, alignment: 'center', margin: [0, 0, 0, 4] },
        
        {
          columns: [
            { text: 'TOTAL:', fontSize: 9, bold: true },
            { text: this.formatPrice(order.total), fontSize: 9, bold: true, alignment: 'right' }
          ],
          margin: [0, 2, 0, 4]
        },
        
        { text: separator, fontSize: 7, alignment: 'center', margin: [0, 2, 0, 4] },
        { text: 'NO VÁLIDO COMO FACTURA', fontSize: 8, bold: true, alignment: 'center', margin: [0, 0, 0, 3] },
        { text: '¡Gracias por tu visita!', fontSize: 8.5, bold: true, alignment: 'center', margin: [0, 1, 0, 1] },
        { text: 'Paskana - Control de Comandas', fontSize: 6.5, alignment: 'center', margin: [0, 1, 0, 0] }
      ]
    };

    pdfMake.createPdf(docDefinition).open();
  }

  async imprimirTicketBluetooth(order: Pedido): Promise<void> {
    if (!this.btPrintService.isConnected()) {
      this.isBtModalOpen = true;
      return;
    }

    const pedidoNorm: any = {
      ...order,
      numeroPedido: order.codigoOrden ? order.codigoOrden : order.numeroPedido,
      fecha: order.fechaCreacion,
      tipoPedido: order.paraLlevar ? 'TakeAway' : 'Mesa',
      numeroMesa: order.mesa,
      nombreCliente: order.observaciones,
      items: order.items.map((i: any) => ({
        ...i,
        producto: { id: i.productoId || '', nombre: i.nombre, precio: i.precioUnitario || i.precio || 0, categoria: 'todos' },
        cantidad: i.cantidad,
        subtotal: i.subtotal,
        comentario: i.comentario
      })),
      montoTotal: order.total,
      metodoPago: order.metodoPago || 'Efectivo',
      estado: order.estado
    };

    try {
      await this.btPrintService.printPedido(pedidoNorm);
    } catch (err) {
      console.error('Error al imprimir por Bluetooth:', err);
    }
  }

  gestionarPedido(order: Pedido) {
    this.orderToManage = order;
    this.editEstado = order.estado;
    this.editEstaPagado = !!order.estaPagado;
    this.editMetodoPago = order.metodoPago || 'por cobrar';
  }

  editarPedido(order: Pedido) {
    this.router.navigate(['/administracion/pedido', order.id]);
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

  formatOnlyTime(dateInput: any): string {
    const d = this.getJsDate(dateInput);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';
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
