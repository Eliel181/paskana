import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CategoriaProducto, Producto } from '../../core/interfaces/producto.model';
import { FirestoreService } from '../../core/services/firestore.service';

interface Categoria {
  label: string;
  value: CategoriaProducto | 'todos';
}

@Component({
  selector: 'app-menu-items',
  imports: [CommonModule],
  templateUrl: './menu-items.component.html',
  styleUrl: './menu-items.component.css'
})
export class MenuItemsComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private subscription: Subscription | null = null;

  isLoading = true;
  productos: Producto[] = [];
  selectedCategory: CategoriaProducto | 'todos' = 'todos';

  categories: Categoria[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Cafés', value: 'cafe' },
    { label: 'Postres', value: 'postre' },
    { label: 'Jugos', value: 'jugo' },
    { label: 'Bebidas', value: 'bebida' },
    { label: 'Minutas', value: 'minuta' },
    { label: 'Desayunos', value: 'desayuno' }
  ];

  // Array de skeletons para el estado de carga
  readonly skeletons = Array(8).fill(0);

  // Control de errores de imágenes de productos para mostrar placeholders
  imageErrors: { [productId: string]: boolean } = {};

  handleImageError(productId: string): void {
    this.imageErrors[productId] = true;
  }

  ngOnInit(): void {
    this.subscription = this.firestoreService
      .getCollection<Producto>('productos')
      .subscribe({
        next: (data) => {
          this.productos = data.filter(p => p.disponible);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar el menú desde Firestore:', err);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get filteredItems(): Producto[] {
    if (this.selectedCategory === 'todos') return this.productos;
    return this.productos.filter(p => p.categoria === this.selectedCategory);
  }

  selectCategory(value: CategoriaProducto | 'todos'): void {
    this.selectedCategory = value;
  }

  formatPrice(precio: number): string {
    return `$${precio.toLocaleString('es-AR')}`;
  }
}
