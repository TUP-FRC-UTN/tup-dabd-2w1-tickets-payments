
import { Routes } from '@angular/router';
import { UsersHomeComponent } from './common/components/users-home/users-home.component';
import { MainComponent } from './common/components/main/main.component';

export const routes: Routes = [
    {
        //si se deja vacío por defecto redirige al login
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    },
    {
        path: 'main',
        component: MainComponent,
        children: [
            {
                path: 'invoices',
                loadChildren: () => import("./invoices/invoice.routes").then((m) => m.INVOICE_ROUTES)
            }
            
        ]
    }
];
