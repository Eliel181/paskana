import { Component, inject, OnInit, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Router, Event, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SpinnerOverlayComponent } from './shared/spinner-overlay/spinner-overlay.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private router: Router = inject(Router);
  private authService: AuthService = inject(AuthService);
  title = 'paskana';

  isAuthLoading: Signal<boolean> = this.authService.isAuthStatusLoaded;

  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => (window as any).HSStaticMethods?.autoInit(), 100);
      }
    });
  }
}
