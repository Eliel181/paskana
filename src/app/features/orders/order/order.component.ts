import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Subscription } from 'rxjs';
import { Producto } from '../../../core/interfaces/producto.model';

@Component({
  selector: 'app-order',
  imports: [],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private subscription: Subscription | null = null;

  isCartOpen = false;
  isLoading = true;
  productos: Producto[] = [];
  selectedCategory = 'todos';

  categories = [
    { label: 'Todo', value: 'todos' },
    { label: 'Cafés', value: 'cafe' },
    { label: 'Tés', value: 'te' },
    { label: 'Bebidas', value: 'bebida' },
    { label: 'Postres', value: 'postre' }
  ];

  readonly skeletons = Array(8).fill(0);

  ngOnInit(): void {
    this.subscription = this.firestoreService
      .getCollection<Producto>('productos')
      .subscribe({
        next: (data) => {
          // List only available products as requested
          this.productos = data.filter(p => p.disponible);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading products for order screen:', err);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }

  get filteredItems(): Producto[] {
    if (this.selectedCategory === 'todos') return this.productos;
    return this.productos.filter(p => p.categoria === this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  formatPrice(price: any): string {
    const num = Number(price);
    return isNaN(num) ? '$0' : `$${num.toLocaleString('es-AR')}`;
  }

  addToCart(producto: Producto) {
    console.log('Producto agregado al carrito:', producto);
  }
}
