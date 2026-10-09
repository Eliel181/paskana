import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/interfaces/usuario.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private location = inject(Location);

  currentUser = this.authService.currentUser;

  nombre = '';
  apellido = '';
  telefono = '';
  perfilBase64 = '';
  email = '';
  rol = '';

  isSaving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.loadUserData(user);
    }
  }

  private loadUserData(user: Usuario): void {
    this.nombre = user.nombre || '';
    this.apellido = user.apellido || '';
    this.telefono = user.telefono || '';
    this.perfilBase64 = user.perfil || '';
    this.email = user.email || '';
    this.rol = user.rol || 'Empleado';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Por favor selecciona un archivo de imagen válido.';
        return;
      }

      this.processImageToBase64(file);
    }
  }

  private processImageToBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar la imagen para optimizar el almacenamiento en Firestore (Base64 ligero)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Exportar a base64 JPEG comprimido (calidad 0.85)
          this.perfilBase64 = canvas.toDataURL('image/jpeg', 0.85);
          this.errorMessage = null;
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.perfilBase64 = '';
  }

  goBack(): void {
    this.location.back();
  }

  async saveProfile(): Promise<void> {
    if (!this.nombre.trim() || !this.apellido.trim()) {
      this.errorMessage = 'El nombre y apellido son obligatorios.';
      return;
    }

    this.isSaving = true;
    this.successMessage = null;
    this.errorMessage = null;

    try {
      await this.authService.updateUserProfile({
        nombre: this.nombre.trim(),
        apellido: this.apellido.trim(),
        telefono: this.telefono.trim(),
        perfil: this.perfilBase64
      });

      this.successMessage = '¡Perfil actualizado correctamente!';
      setTimeout(() => {
        this.successMessage = null;
      }, 4000);
    } catch (err: any) {
      console.error('Error al guardar perfil:', err);
      this.errorMessage = err.message || 'Ocurrió un error al actualizar el perfil.';
    } finally {
      this.isSaving = false;
    }
  }
}
