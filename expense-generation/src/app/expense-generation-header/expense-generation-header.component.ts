import { Component } from '@angular/core';

@Component({
  selector: 'app-expense-generation-header',
  standalone: true,
  imports: [],
  templateUrl: './expense-generation-header.component.html',
  styleUrl: './expense-generation-header.component.css'
})
export class ExpenseGenerationHeaderComponent {

  toggleTheme() {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-bs-theme', newTheme);
  }

}
