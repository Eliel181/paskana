import { Component } from '@angular/core';
import { RouterModule, RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { FooterComponent } from "../footer/footer.component";

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, FooterComponent, RouterLinkWithHref],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent {
  isMobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
