import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ExpenseGenerationAdminViewComponent } from './expense-generation-admin-view/expense-generation-admin-view.component';
import { ExpenseGenerationViewComponent } from './expense-generation-view/expense-generation-view.component';
import { ExpenseGenerationUserViewComponent } from './expense-generation-user-view/expense-generation-user-view.component';
import { ExpenseGenerationCounterView2Component } from './expense-generation-counter-view-2/expense-generation-counter-view-2.component';
import { ExpenseGenerationPaymentFormComponent } from './expense-generation-payment-form/expense-generation-payment-form.component';
import {ExpenseGenerationNavbarComponent} from "./expense-generation-navbar/expense-generation-navbar.component";

export const routes: Routes = [
    { path: '', component: ExpenseGenerationNavbarComponent },
    { path: 'expense-generation-admin-view', component: ExpenseGenerationAdminViewComponent },
    {path: 'expense-generation-user-view', component: ExpenseGenerationUserViewComponent},
     {path: 'expense-generation-accountant-view', component: ExpenseGenerationCounterView2Component},
     {path: 'expense-generation-payment-form', component: ExpenseGenerationPaymentFormComponent},
    { path: '**', redirectTo: '' }

  ];

  @NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule {}
