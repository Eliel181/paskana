import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
    { path: '', redirectTo: '', pathMatch: 'full' },
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            {
                path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'menu', loadComponent: () => import('./pages/menu-items/menu-items.component').then(m => m.MenuItemsComponent)
            },
            {
                path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
            }
        ]
    }
];
