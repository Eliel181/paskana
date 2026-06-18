import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoriaProducto, Producto } from '../../../core/interfaces/producto.model';
import { FirestoreService } from '../../../core/services/firestore.service';

@Component({
  selector: 'app-form-product',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './form-product.component.html',
  styleUrl: './form-product.component.css'
})
export class FormProductComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestoreService: FirestoreService = inject(FirestoreService);

  productForm!: FormGroup;
  isEditMode = false;
  productId: string | null = null;

  // Lista de categorías para el dropdown
  categories: { label: string; value: CategoriaProducto }[] = [
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

  // Mock list to load initial data if editing
  private mockProducts: Producto[] = [
    {
      id: '1',
      nombre: 'Café Latte Especial',
      descripcion: 'Espresso con leche cremosa vaporizada y una suave capa de espuma, decorado con arte latte.',
      categoria: 'cafe',
      precio: 2200,
      imagen: { public_id: 'featured_coffee', secure_url: '/featured_coffee.png' },
      disponible: true,
      destacado: true,
      stock: 45,
      fechaCreacion: new Date('2026-01-15')
    }
  ];

  selectedFileName = '';
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.checkRouteParams();
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      categoria: ['cafe', [Validators.required]],
      precio: [null, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      imagenUrl: ['', [Validators.required]],
      disponible: [true],
      destacado: [false]
    });
  }

  private checkRouteParams(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProductData(this.productId);
    }
  }

  private async loadProductData(id: string): Promise<void> {
    try {
      const product = await this.firestoreService.getDocument<Producto>('productos', id);
      if (product) {
        this.productForm.patchValue({
          nombre: product.nombre,
          descripcion: product.descripcion || '',
          categoria: product.categoria,
          precio: product.precio,
          stock: product.stock ?? 0,
          imagenUrl: product.imagen?.secure_url || '',
          disponible: product.disponible,
          destacado: product.destacado
        });
        
        if (product.imagen?.secure_url) {
          const parts = product.imagen.secure_url.split('/');
          this.selectedFileName = parts[parts.length - 1];
          this.imagePreviewUrl = product.imagen.secure_url;
        }
      }
    } catch (err) {
      console.error('Error al cargar datos del producto desde Firestore:', err);
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      
      // Leer el archivo para generar la previsualización local en el navegador
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Dado que no hay servicio de subida de imágenes real en el frontend para el mock,
      // actualizamos el control del formulario con un nombre representativo para pasar la validación
      this.productForm.patchValue({
        imagenUrl: `/assets/images/${file.name}`
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const { nombre, descripcion, categoria, precio, stock, imagenUrl, disponible, destacado } = this.productForm.value;

    const productPayload: any = {
      nombre,
      descripcion,
      categoria,
      precio,
      stock,
      imagen: {
        public_id: this.productId || 'new_product_' + Date.now(),
        secure_url: imagenUrl
      },
      disponible,
      destacado,
      fechaActualizacion: new Date()
    };

    try {
      if (this.isEditMode && this.productId) {
        await this.firestoreService.updateDocument<Producto>('productos', this.productId, productPayload);
        console.log('Producto actualizado con éxito en Firestore');
      } else {
        productPayload.fechaCreacion = new Date();
        await this.firestoreService.addDocument('productos', productPayload);
        console.log('Producto creado con éxito en Firestore');
      }
      this.router.navigate(['/administracion/productos']);
    } catch (err) {
      console.error('Error al guardar el producto en Firestore:', err);
    }
  }
}

