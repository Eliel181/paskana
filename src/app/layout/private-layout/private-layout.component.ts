import { Component, computed, inject, Signal, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/interfaces/usuario.model';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css'
})
export class PrivateLayoutComponent implements OnInit, OnDestroy {
  private authService: AuthService = inject(AuthService);

  currentUser: Signal<Usuario | null | undefined> = this.authService.currentUser;
  isSidebarOpen = false;
  isUserDropdownOpen = false;

  // Reloj y Fecha en tiempo real
  currentTime = signal(new Date());
  private clockIntervalId: any;

  timeString = computed(() => {
    return this.currentTime().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' hs';
  });

  dateString = computed(() => {
    const d = this.currentTime();
    const str = d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const nameInitial = user.nombre ? user.nombre.charAt(0).toUpperCase() : '';
    const surnameInitial = user.apellido ? user.apellido.charAt(0).toUpperCase() : '';
    return `${nameInitial}${surnameInitial}`;
  });

  ngOnInit(): void {
    this.clockIntervalId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
    }
  }

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
