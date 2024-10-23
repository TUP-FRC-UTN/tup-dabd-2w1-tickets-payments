import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ExpenseGenerationAdminViewComponent } from './expense-generation-admin-view/expense-generation-admin-view.component';
import { ExpenseGenerationViewComponent } from './expense-generation-view/expense-generation-view.component';

export const routes: Routes = [
  { path: '', component: ExpenseGenerationViewComponent },
  {
    path: 'expense-generation-admin-view',
    component: ExpenseGenerationAdminViewComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
