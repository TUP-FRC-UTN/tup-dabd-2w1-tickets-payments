import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ExpenseGenerationExpenseService } from '../expense-generation-services/expense-generation-expense.service';
import { ExpenseGenerationExpenseInterface } from '../expense-generation-interfaces/expense-generation-expense-interface';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-expense-generation-admin-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-generation-admin-view.component.html',
  styleUrls: ['./expense-generation-admin-view.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExpenseGenerationAdminViewComponent implements OnInit {
  ownerId: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  expenses: ExpenseGenerationExpenseInterface[] = [];

  filtros = {
    desde: '',
    hasta: '',
    estado: '',
    montoMinimo: null as number | null,
  };

  estados = ['Pendiente', 'Pago', 'Vencido'];

  constructor(private expenseService: ExpenseGenerationExpenseService) {}

  ngOnInit() {}
  //This function is used to search the expenses
  buscar() {
    if (!this.ownerId) {
      this.error = 'El ID del propietario es obligatorio';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.expenseService.getAllExpenses(Number(this.ownerId)).subscribe({
      next: (expenses) => {
        let filteredExpenses = expenses;

        // Apply Filters
        if (this.filtros.estado) {
          filteredExpenses = filteredExpenses.filter(
            (expense) => expense.status === this.filtros.estado
          );
        }

        if (this.filtros.desde) {
          filteredExpenses = filteredExpenses.filter(
            (expense) =>
              new Date(expense.issueDate) >= new Date(this.filtros.desde)
          );
        }

        if (this.filtros.hasta) {
          filteredExpenses = filteredExpenses.filter(
            (expense) =>
              new Date(expense.issueDate) <= new Date(this.filtros.hasta)
          );
        }

        if (this.filtros.montoMinimo) {
          filteredExpenses = filteredExpenses.filter(
            (expense) =>
              expense.first_expiration_amount >= this.filtros.montoMinimo!
          );
        }

        this.expenses = filteredExpenses;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los gastos: ' + error.message;
        this.isLoading = false;
      },
    });
  }
  //When OwnerId Change, everything is cleaned
  onOwnerIdChange() {
    this.filtros.estado = '';
    this.filtros.desde = '';
    this.filtros.hasta = '';
    this.filtros.montoMinimo = null;
    this.buscar(); // Here calls the function to search the expenses
  }
  //Clean Filters
  limpiarFiltros() {
    this.filtros = {
      desde: '',
      hasta: '',
      estado: '',
      montoMinimo: null,
    };
    this.ownerId = '';
    this.expenses = [];
    this.error = null;
  }
  //Format to date
  formatDate(date: Date | string | null): string {
    if (!date) return 'Sin fecha';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  }
  //Format to get the status of the expense
  getStatusBadgeClass(status: string): string {
    if (!status) return 'badge bg-secondary';

    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'badge bg-warning text-dark';
      case 'pago':
        return 'badge bg-success';
      case 'vencido':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  verDetalles(expense: ExpenseGenerationExpenseInterface) {
    console.log('Detalles del gasto:', expense);
    //ACA VAMOS A TENER QUE PONER LO DE LOS DETALLES, OSEA EL BOTON ESE VERMAS
  }
}
