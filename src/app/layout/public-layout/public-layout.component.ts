import { Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { FooterComponent } from "../footer/footer.component";
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, FooterComponent, RouterLinkWithHref, RouterModule],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent {
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  isMobileMenuOpen = false;
  isUserDropdownOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  logOut(): void {
    this.authService.logOut();
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return !!user && (user.rol?.toLowerCase() === 'admin' || user.rol === 'Admin');
  }
}
