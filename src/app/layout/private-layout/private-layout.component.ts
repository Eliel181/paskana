import { Component, computed, inject, Signal } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/interfaces/usuario.model';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css'
})
export class PrivateLayoutComponent {
  private authService: AuthService = inject(AuthService);

  currentUser: Signal<Usuario | null | undefined> = this.authService.currentUser;
  isSidebarOpen = false;
  isUserDropdownOpen = false;

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const nameInitial = user.nombre ? user.nombre.charAt(0).toUpperCase() : '';
    const surnameInitial = user.apellido ? user.apellido.charAt(0).toUpperCase() : '';
    return `${nameInitial}${surnameInitial}`;
  });

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  logOut(): void {
    this.authService.logOut();
  }

}
