export interface Pedido {
    id: string;
    numeroPedido: number;
    usuarioId?: string;   // el id del currentUser que esta haciendo el pedido
    usuarioNombre?: string;

    estado: EstadoPedido;

    items: PedidoItem[];

    subtotal: number;
    descuento?: number;
    total: number;

    metodoPago: MetodoPago;

    observaciones?: string;
    mesa?: number;
    paraLlevar?: boolean;

    estaPagado?: boolean;
    codigoOrden?: string;

    fechaCreacion: Date;
    fechaActualizacion?: Date;
}

export interface PedidoItem {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;    // Precio ya dividido si es media porción (precio / 2)
    subtotal: number;
    comentario?: string;
    esMediaPorcion?: boolean;  // true = se solicitó media porción (precio dividido a la mitad)
}

export type EstadoPedido =
    | 'pendiente'
    | 'en_preparacion'
    | 'listo'
    | 'entregado'
    | 'cancelado';

export type MetodoPago =
    | 'por cobrar'
    | 'efectivo'
    | 'debito'
    | 'credito'
    | 'transferencia';
