import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CierreCaja, MovimientoCaja } from '../../../core/interfaces/cierre-caja.model';
import { Pedido } from '../../../core/interfaces/pedido.model';
import { FirestoreService } from '../../../core/services/firestore.service';

@Component({
  selector: 'app-cash-closing',
  imports: [CommonModule, FormsModule],
  templateUrl: './cash-closing.component.html',
  styleUrl: './cash-closing.component.css'
})
export class CashClosingComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private ventasSub: Subscription | null = null;
  private cierresSub: Subscription | null = null;

  // Estado de la caja del día
  isClosed = false;
  fechaCaja: Date = new Date();
  responsableActual = 'Eliel';
  
  private _turno: 'mañana' | 'tarde' = 'mañana';
  get turno(): 'mañana' | 'tarde' {
    return this._turno;
  }
  set turno(value: 'mañana' | 'tarde') {
    this._turno = value;
    this.cargarVentasDelTurno();
  }

  // Valores de la caja
  cajaInicial = 5000;
  ventasEfectivo = 0;
  ventasDebito = 0;
  ventasCredito = 0;
  ventasTransferencia = 0;
  
  // Arqueo
  efectivoReal = 0;
  efectivoDejado = 5000;
  observaciones = '';

  // Modal de movimientos
  showMovimientoModal = false;
  movimientoTipo: 'ingreso' | 'egreso' = 'ingreso';
  movimientoMonto: number | null = null;
  movimientoConcepto = '';

  // Movimientos del día
  movimientos: MovimientoCaja[] = [];

  // Historial de cierres
  cierresAnteriores: CierreCaja[] = [];

  ngOnInit(): void {
    this.cargarVentasDelTurno();
    this.cargarHistorialCierres();
  }

  ngOnDestroy(): void {
    this.ventasSub?.unsubscribe();
    this.cierresSub?.unsubscribe();
  }

  cargarVentasDelTurno() {
    if (this.ventasSub) {
      this.ventasSub.unsubscribe();
    }

    const start = new Date(this.fechaCaja);
    const end = new Date(this.fechaCaja);
    if (this.turno === 'mañana') {
      start.setHours(7, 0, 0, 0);
      end.setHours(14, 0, 0, 0);
    } else {
      start.setHours(16, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    this.ventasSub = this.firestoreService
      .getCollectionByDateRange<Pedido>('pedidos', 'fechaCreacion', start, end)
      .subscribe({
        next: (pedidos) => {
          let efectivo = 0;
          let debito = 0;
          let credito = 0;
          let transferencia = 0;

          pedidos.forEach(pedido => {
            // Solo se deben sumar los pedidos que sean != 'por cobrar' y != 'cancelado'
            if (pedido.estado !== 'cancelado' && pedido.metodoPago !== 'por cobrar') {
              const total = pedido.total || 0;
              switch (pedido.metodoPago) {
                case 'efectivo':
                  efectivo += total;
                  break;
                case 'debito':
                  debito += total;
                  break;
                case 'credito':
                  credito += total;
                  break;
                case 'transferencia':
                  transferencia += total;
                  break;
              }
            }
          });

          this.ventasEfectivo = efectivo;
          this.ventasDebito = debito;
          this.ventasCredito = credito;
          this.ventasTransferencia = transferencia;
        },
        error: (err) => {
          console.error('Error al cargar ventas del turno:', err);
        }
      });
  }

  cargarHistorialCierres() {
    this.cierresSub = this.firestoreService
      .getCollection<CierreCaja>('cierres_caja')
      .subscribe({
        next: (cierres) => {
          this.cierresAnteriores = cierres.map(c => ({
            ...c,
            fecha: this.getJsDate(c.fecha),
            movimientos: (c.movimientos || []).map(m => ({
              ...m,
              fecha: this.getJsDate(m.fecha)
            }))
          })).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        },
        error: (err) => {
          console.error('Error al cargar historial de cierres:', err);
        }
      });
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

  // Getters para cálculos automáticos
  get totalVentas(): number {
    return this.ventasEfectivo + this.ventasDebito + this.ventasCredito + this.ventasTransferencia;
  }

  get totalIngresosManuales(): number {
    return this.movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + m.monto, 0);
  }

  get totalEgresosManuales(): number {
    return this.movimientos
      .filter(m => m.tipo === 'egreso')
      .reduce((sum, m) => sum + m.monto, 0);
  }

  get efectivoEsperado(): number {
    return this.cajaInicial + this.ventasEfectivo + this.totalIngresosManuales - this.totalEgresosManuales;
  }

  get diferencia(): number {
    return this.efectivoReal - this.efectivoEsperado;
  }

  get efectivoARetirar(): number {
    return Math.max(0, this.efectivoReal - this.efectivoDejado);
  }

  // Acciones
  openMovimientoModal(tipo: 'ingreso' | 'egreso') {
    this.movimientoTipo = tipo;
    this.movimientoMonto = null;
    this.movimientoConcepto = '';
    this.showMovimientoModal = true;
  }

  closeMovimientoModal() {
    this.showMovimientoModal = false;
  }

  agregarMovimiento() {
    if (!this.movimientoMonto || this.movimientoMonto <= 0 || !this.movimientoConcepto.trim()) {
      alert('Por favor, ingresa un monto válido y un concepto para el movimiento.');
      return;
    }

    this.movimientos.push({
      id: Date.now().toString(),
      tipo: this.movimientoTipo,
      monto: this.movimientoMonto,
      concepto: this.movimientoConcepto.trim(),
      fecha: new Date()
    });

    this.closeMovimientoModal();
  }

  eliminarMovimiento(id: string) {
    this.movimientos = this.movimientos.filter(m => m.id !== id);
  }

  async realizarCierre() {
    if (this.efectivoReal <= 0) {
      if (!confirm('¿Estás seguro de realizar el cierre de caja con $0 en efectivo real?')) {
        return;
      }
    }

    if (Math.abs(this.diferencia) > 0) {
      if (!confirm(`Existe una diferencia de $${this.formatPriceWithoutSymbol(this.diferencia)}. ¿Deseas proceder con el cierre de todas formas?`)) {
        return;
      }
    }

    const nuevoCierre: CierreCaja = {
      fecha: new Date(),
      responsable: this.responsableActual,
      turno: this.turno,
      cajaInicial: this.cajaInicial,
      ventasEfectivo: this.ventasEfectivo,
      ventasDebito: this.ventasDebito,
      ventasCredito: this.ventasCredito,
      ventasTransferencia: this.ventasTransferencia,
      totalVentas: this.totalVentas,
      movimientos: [...this.movimientos],
      totalIngresosManuales: this.totalIngresosManuales,
      totalEgresosManuales: this.totalEgresosManuales,
      efectivoEsperado: this.efectivoEsperado,
      efectivoReal: this.efectivoReal,
      diferencia: this.diferencia,
      efectivoDejado: this.efectivoDejado,
      efectivoARetirar: this.efectivoARetirar,
      observaciones: this.observaciones,
      estado: 'cerrado'
    };

    try {
      await this.firestoreService.addDocument('cierres_caja', nuevoCierre);
      this.isClosed = true;
      alert('Cierre de caja registrado exitosamente en Firestore.');
    } catch (err) {
      console.error('Error al guardar el cierre de caja:', err);
      alert('Hubo un error al guardar el cierre de caja en la base de datos.');
    }
  }

  reabrirCaja() {
    if (confirm('¿Deseas volver a abrir la caja para realizar ajustes? El último cierre guardado en el historial de esta sesión se mantendrá para visualización.')) {
      this.isClosed = false;
    }
  }

  // Auxiliares de formato
  formatPrice(price: number): string {
    return `$${Math.abs(price).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  formatPriceWithoutSymbol(price: number): string {
    return Math.abs(price).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }
}
