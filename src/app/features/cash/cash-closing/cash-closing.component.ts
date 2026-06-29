import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MovimientoCaja {
  id: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  concepto: string;
  fecha: Date;
}

interface CierreCajaRegistro {
  fecha: Date;
  cajaInicial: number;
  esperado: number;
  real: number;
  diferencia: number;
  responsable: string;
  turno: 'mañana' | 'tarde';
  efectivoDejado?: number;
}

@Component({
  selector: 'app-cash-closing',
  imports: [CommonModule, FormsModule],
  templateUrl: './cash-closing.component.html',
  styleUrl: './cash-closing.component.css'
})
export class CashClosingComponent {
  // Estado de la caja del día
  isClosed = false;
  fechaCaja: Date = new Date();
  responsableActual = 'Eliel';
  turno: 'mañana' | 'tarde' = 'mañana';

  // Valores de la caja
  cajaInicial = 5000;
  ventasEfectivo = 12450;
  ventasDebito = 8300;
  ventasCredito = 4200;
  ventasTransferencia = 9100;
  
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
  movimientos: MovimientoCaja[] = [
    { id: '1', tipo: 'egreso', monto: 1200, concepto: 'Compra de insumos urgentes (leche)', fecha: new Date() },
    { id: '2', tipo: 'ingreso', monto: 1500, concepto: 'Cambio de billetes chicos provisto', fecha: new Date() }
  ];

  // Historial de cierres
  cierresAnteriores: CierreCajaRegistro[] = [
    { fecha: new Date(Date.now() - 86400000), cajaInicial: 5000, esperado: 32450, real: 32450, diferencia: 0, responsable: 'Eliel', turno: 'tarde', efectivoDejado: 5000 },
    { fecha: new Date(Date.now() - 86400000 * 2), cajaInicial: 5000, esperado: 28450, real: 28350, diferencia: -100, responsable: 'Laura', turno: 'mañana', efectivoDejado: 5000 },
    { fecha: new Date(Date.now() - 86400000 * 3), cajaInicial: 5000, esperado: 30100, real: 30150, diferencia: 50, responsable: 'Eliel', turno: 'tarde', efectivoDejado: 5000 }
  ];

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

  realizarCierre() {
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

    this.isClosed = true;

    // Agregar al historial de cierres
    this.cierresAnteriores.unshift({
      fecha: new Date(),
      cajaInicial: this.cajaInicial,
      esperado: this.efectivoEsperado,
      real: this.efectivoReal,
      diferencia: this.diferencia,
      responsable: this.responsableActual,
      turno: this.turno,
      efectivoDejado: this.efectivoDejado
    });
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
