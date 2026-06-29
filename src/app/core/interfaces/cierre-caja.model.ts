export interface MovimientoCaja {
  id: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  concepto: string;
  fecha: Date;
}

export interface CierreCaja {
  id?: string;                       // ID del documento (generalmente asignado por Firestore)
  fecha: Date;                       // Fecha en la que se registra el cierre
  responsable: string;               // Nombre del responsable de la caja (ej. 'Eliel')
  turno: Turno;                      // Turno de la caja ('mañana' | 'tarde')
  
  // Valores iniciales y de ventas
  cajaInicial: number;               // Monto de efectivo con el que se abrió la caja
  ventasEfectivo: number;            // Total de ventas en efectivo
  ventasDebito: number;              // Total de ventas con tarjeta de débito
  ventasCredito: number;             // Total de ventas con tarjeta de crédito
  ventasTransferencia: number;       // Total de ventas por transferencia
  totalVentas: number;               // Suma total de las ventas del turno
  
  // Movimientos adicionales (ingresos y egresos manuales)
  movimientos: MovimientoCaja[];
  totalIngresosManuales: number;     // Suma de los movimientos manuales de tipo 'ingreso'
  totalEgresosManuales: number;      // Suma de los movimientos manuales de tipo 'egreso'
  
  // Arqueo y balance de efectivo
  efectivoEsperado: number;          // cajaInicial + ventasEfectivo + ingresosManuales - egresosManuales
  efectivoReal: number;              // Monto real de efectivo contado físicamente
  diferencia: number;                // efectivoReal - efectivoEsperado (sobrante o faltante)
  
  // Continuidad de la caja
  efectivoDejado: number;            // Efectivo que queda en caja para el siguiente turno
  efectivoARetirar: number;          // Efectivo sobrante que se retira de la caja
  
  // Estado y comentarios
  observaciones?: string;            // Notas o aclaraciones sobre el arqueo/cierre
  estado: EstadoCaja;                // 'abierto' o 'cerrado'
}

export type Turno = 'mañana' | 'tarde';
export type EstadoCaja = 'abierto' | 'cerrado';
