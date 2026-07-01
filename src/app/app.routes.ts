import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { PrivateLayoutComponent } from './layout/private-layout/private-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

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
    },
    {
        path: 'administracion',
        component: PrivateLayoutComponent,
        canActivate: [authGuard, adminGuard],
        children: [
            {
                path: 'productos', loadComponent: () => import('./features/product/list-products/list-products.component').then(m => m.ListProductsComponent)
            },
            {
                path: 'producto', loadComponent: () => import('./features/product/form-product/form-product.component').then(m => m.FormProductComponent)
            },
            {
                path: 'producto/:id', loadComponent: () => import('./features/product/form-product/form-product.component').then(m => m.FormProductComponent)
            },
            {
                path: 'pedidos', loadComponent: () => import('./features/orders/all-orders/all-orders.component').then(m => m.AllOrdersComponent)
            },
            {
                path: 'pedido', loadComponent: () => import('./features/orders/order/order.component').then(m => m.OrderComponent)
            },
            {
                path: 'caja', loadComponent: () => import('./features/cash/cash-closing/cash-closing.component').then(m => m.CashClosingComponent)
            }
        ]
    }
];
