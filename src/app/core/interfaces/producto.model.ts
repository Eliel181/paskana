export type CategoriaProducto =
    | 'cafe'
    | 'te'
    | 'bebida'
    | 'jugo'
    | 'minuta'
    | 'sandwich'
    | 'tostado'
    | 'factura'
    | 'postre'
    | 'torta'
    | 'desayuno'
    | 'merienda';

export interface ImagenProducto {
    public_id: string;
    secure_url: string;
}

export interface Producto {
    id: string;
    nombre: string;
    descripcion?: string;
    categoria: CategoriaProducto;
    precio: number;
    imagen: ImagenProducto;
    disponible: boolean;
    stock?: number;
    fechaCreacion: Date;
    fechaActualizacion?: Date;
}

