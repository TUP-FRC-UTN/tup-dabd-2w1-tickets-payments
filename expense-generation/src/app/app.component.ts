import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExpenseGenerationViewComponent } from './expense-generation-view/expense-generation-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ExpenseGenerationViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'expense-generation';
}
