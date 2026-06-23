export interface Pedido {
    id: string;
    numeroPedido: number;

    //clienteId?: string;
    //clienteNombre?: string;

    estado: EstadoPedido;

    items: PedidoItem[];

    subtotal: number;
    descuento?: number;
    total: number;

    metodoPago: MetodoPago;

    observaciones?: string;

    fechaCreacion: Date;
    fechaActualizacion?: Date;
}

export interface PedidoItem {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export type EstadoPedido =
    | 'pendiente'
    | 'en_preparacion'
    | 'listo'
    | 'entregado'
    | 'cancelado';

export type MetodoPago =
    | 'efectivo'
    | 'debito'
    | 'credito'
    | 'transferencia'
    | 'mercado_pago';
