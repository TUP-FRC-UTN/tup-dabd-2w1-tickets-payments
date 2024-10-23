import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ExpenseGenerationViewComponent } from './expense-generation-view/expense-generation-view.component';
import { routes } from './app.routes';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ExpenseGenerationViewComponent, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'expense-generation';
}
