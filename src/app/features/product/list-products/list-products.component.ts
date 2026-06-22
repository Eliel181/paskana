import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CategoriaProducto, Producto } from '../../../core/interfaces/producto.model';
import { RouterModule } from '@angular/router';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-products',
  imports: [RouterModule],
  templateUrl: './list-products.component.html',
  styleUrl: './list-products.component.css'
})
export class ListProductsComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private sub?: Subscription;

  // Categorías con etiquetas legibles para el filtro
  categories: { label: string; value: CategoriaProducto | null }[] = [
    { label: 'Todos', value: null },
    { label: 'Café', value: 'cafe' },
    { label: 'Té', value: 'te' },
    { label: 'Bebidas', value: 'bebida' },
    { label: 'Jugos', value: 'jugo' },
    { label: 'Minutas', value: 'minuta' },
    { label: 'Sándwiches', value: 'sandwich' },
    { label: 'Tostados', value: 'tostado' },
    { label: 'Facturas', value: 'factura' },
    { label: 'Postres', value: 'postre' },
    { label: 'Tortas', value: 'torta' },
    { label: 'Desayunos', value: 'desayuno' },
    { label: 'Meriendas', value: 'merienda' }
  ];

  selectedCategory: CategoriaProducto | null = null;
  products: Producto[] = [];

  ngOnInit(): void {
    // Escuchar la colección de productos en tiempo real desde Firestore
    this.sub = this.firestoreService.getCollection<Producto>('productos').subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (err) => {
        console.error('Error al cargar productos de Firestore:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // Obtener la lista filtrada de productos
  get filteredProducts(): Producto[] {
    if (this.selectedCategory === null) {
      return this.products;
    }
    return this.products.filter(p => p.categoria === this.selectedCategory);
  }

  // Cambiar categoría seleccionada
  selectCategory(category: CategoriaProducto | null): void {
    this.selectedCategory = category;
  }

  formatPrice(price: any): string {
    const num = Number(price);
    return isNaN(num) ? '$0' : `$${num.toLocaleString('es-AR')}`;
  }

  // Toggle de disponibilidad real en Firestore
  async toggleDisponibilidad(product: Producto): Promise<void> {
    try {
      await this.firestoreService.updateDocument<Producto>('productos', product.id, {
        disponible: !product.disponible
      });
    } catch (err) {
      console.error('Error al actualizar disponibilidad en Firestore:', err);
    }
  }

  // Eliminar producto real de Firestore
  async eliminarProducto(id: string): Promise<void> {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await this.firestoreService.deleteDocument('productos', id);
      } catch (err) {
        console.error('Error al eliminar producto en Firestore:', err);
      }
    }
  }
}

