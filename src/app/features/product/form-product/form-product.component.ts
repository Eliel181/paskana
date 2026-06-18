import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoriaProducto, ImagenProducto, Producto } from '../../../core/interfaces/producto.model';
import { FirestoreService } from '../../../core/services/firestore.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';

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
  private firestoreService = inject(FirestoreService);
  private cloudinaryService = inject(CloudinaryService);

  productForm!: FormGroup;
  isEditMode = false;
  productId: string | null = null;

  // Estado de carga para feedback visual
  isUploading = false;

  // Imagen existente (en modo edición, cuando no se selecciona un archivo nuevo)
  private existingImage: ImagenProducto | null = null;

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
      // Control auxiliar para la validación de imagen: required si no hay imagen existente
      imagenControl: ['', [Validators.required]],
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
          disponible: product.disponible,
          destacado: product.destacado
        });

        if (product.imagen?.secure_url) {
          this.existingImage = product.imagen;
          this.imagePreviewUrl = product.imagen.secure_url;
          const parts = product.imagen.secure_url.split('/');
          this.selectedFileName = parts[parts.length - 1];
          // En edición, la imagen ya existe, el control no necesita ser requerido
          this.productForm.get('imagenControl')?.clearValidators();
          this.productForm.get('imagenControl')?.updateValueAndValidity();
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

      // Preview local instantánea con FileReader
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Marcar el control como válido ya que hay un archivo seleccionado
      this.productForm.patchValue({ imagenControl: file.name });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isUploading = true;

    try {
      // Determinar la imagen final a guardar en Firestore
      let imagenFinal: ImagenProducto;

      if (this.selectedFile) {
        // Hay un archivo nuevo: subir a Cloudinary y obtener la URL real
        imagenFinal = await this.cloudinaryService.uploadImage(this.selectedFile);
      } else if (this.existingImage) {
        // Modo edición sin nuevo archivo: reusar la imagen ya guardada
        imagenFinal = this.existingImage;
      } else {
        console.error('No hay imagen seleccionada.');
        this.isUploading = false;
        return;
      }

      const { nombre, descripcion, categoria, precio, stock, disponible, destacado } = this.productForm.value;

      const productPayload = {
        nombre,
        descripcion,
        categoria,
        precio,
        stock,
        imagen: imagenFinal,
        disponible,
        destacado,
        fechaActualizacion: new Date()
      };

      if (this.isEditMode && this.productId) {
        await this.firestoreService.updateDocument<Producto>('productos', this.productId, productPayload);
      } else {
        await this.firestoreService.addDocument('productos', {
          ...productPayload,
          fechaCreacion: new Date()
        });
      }

      this.router.navigate(['/administracion/productos']);
    } catch (err) {
      console.error('Error al guardar el producto:', err);
    } finally {
      this.isUploading = false;
    }
  }
}
