import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink, RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FirestoreService } from '../../core/services/firestore.service';
import { Producto } from '../../core/interfaces/producto.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private subscription: Subscription | null = null;

  featuredProduct: Producto | null = null;
  isLoadingFeatured = true;
  imageError = false;

  readonly defaultProduct: any = {
    nombre: 'Especial Latte',
    descripcion: 'Delicioso espresso con leche espumosa.',
    precio: 5000,
    categoria: 'cafe',
    imagen: { secure_url: '/sub-gol.jpg' }
  };

  ngOnInit(): void {
    this.subscription = this.firestoreService
      .getCollection<Producto>('productos')
      .subscribe({
        next: (data) => {
          const featured = data.filter(p => p.disponible && p.destacado);
          if (featured.length > 0) {
            // Get a random featured product
            this.featuredProduct = featured[Math.floor(Math.random() * featured.length)];
          }
          this.isLoadingFeatured = false;
        },
        error: (err) => {
          console.error('Error al cargar producto destacado:', err);
          this.isLoadingFeatured = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  formatPrice(precio: number): string {
    return `$${precio.toLocaleString('es-AR')}`;
  }
}
