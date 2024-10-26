import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ExpenseGenerationExpenseService } from '../expense-generation-services/expense-generation-expense.service';
import { ExpenseGenerationExpenseInterface } from '../expense-generation-interfaces/expense-generation-expense-interface';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Owner } from '../expense-generation-interfaces/owner';

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
  showFilters: boolean = false;
  searchTerm: string = '';
  searchType: 'name' | 'dni' | 'plot' = 'name';
  filteredUsers: Owner[] = [];
  selectedOwner: Owner | null = null;
  allOwners: Owner[] = [];
  ownerMap: Map<number, string> = new Map();
  Owner: Owner | null = null;

  filtros = {
    desde: '',
    hasta: '',
    estado: '',
    montoMinimo: null as number | null,
  };

  estados = ['Pendiente', 'Pago', 'Vencido'];

  constructor(private expenseService: ExpenseGenerationExpenseService) {}

  ngOnInit() {
    this.loadActiveOwners();
    this.loadAllExpenses(); // Load all expenses initially
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  loadActiveOwners() {
    this.isLoading = true;
    this.expenseService.getActiveOwners().subscribe({
      next: (owners) => {
        this.allOwners = owners;
        // Create a map of owner IDs to full names
        this.ownerMap = new Map(
          owners.map((owner) => [owner.id, `${owner.name} ${owner.lastname}`])
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los usuarios: ' + error.message;
        this.isLoading = false;
      },
    });
  }

  loadAllExpenses() {
    this.isLoading = true;
    this.error = null;

    this.expenseService.getAllExpensesForAllOwners().subscribe({
      next: (expenses) => {
        this.applyFiltersToExpenses(expenses);
      },
      error: (error) => {
        this.error = 'Error al cargar los gastos: ' + error.message;
        this.isLoading = false;
      },
    });
  }

  limpiarFiltros() {
    this.filtros = {
      desde: '',
      hasta: '',
      estado: '',
      montoMinimo: null,
    };
    this.searchTerm = '';
    this.selectedOwner = null;
    this.error = null;
    this.filteredUsers = [];
    this.loadAllExpenses(); // Load all expenses when filters are cleared
  }

  getOwnerName(ownerId: number): string {
    return this.ownerMap.get(ownerId) || `ID: ${ownerId}`;
  }

  getPlotNumbers(owner: Owner): string {
    if (!owner.plots || owner.plots.length === 0) return 'Sin lotes';
    return owner.plots.map((plot) => `${plot.plotNumber}`).join(', ');
  }

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

  verDetalles(expense: ExpenseGenerationExpenseInterface) {
    //AQUI IMPLEMENTAR LA FUNCIONALIDAD PARA VER LOS DETALLES DE UN GASTO
  }

  buscarUsuarios() {
    if (this.searchTerm.length < 2) {
      this.filteredUsers = [];
      return;
    }

    this.filteredUsers = this.allOwners.filter((owner) => {
      if (this.searchType === 'name') {
        const fullName = `${owner.name} ${owner.lastname}`.toLowerCase();
        return fullName.includes(this.searchTerm.toLowerCase());
      } else {
        return owner.dni.toString().includes(this.searchTerm);
      }
    });
  }

  seleccionarUsuario(owner: Owner) {
    this.selectedOwner = owner;
    this.searchTerm =
      this.searchType === 'name'
        ? `${owner.name} ${owner.lastname}`
        : owner.dni.toString();
    this.buscarBoletas();
  }
  getPropietarioById(id: number) {
    this.expenseService.GetOwnerById(id).subscribe({
      next: (owner) => {
        this.Owner = owner;
      },
      error: (error) => {
        this.error = 'Error al cargar el propietario: ' + error.message;
      },
    });
    return this.Owner?.name;
  }
  buscarBoletas() {
    this.isLoading = true;
    this.error = null;

    const observable = this.selectedOwner
      ? this.expenseService.getAllExpenses(this.selectedOwner.id)
      : this.expenseService.getAllExpensesForAllOwners();

    observable.subscribe({
      next: (expenses) => {
        this.applyFiltersToExpenses(expenses);
      },
      error: (error) => {
        this.error = 'Error al cargar los gastos: ' + error.message;
        this.isLoading = false;
      },
    });
  }

  private applyFiltersToExpenses(
    expenses: ExpenseGenerationExpenseInterface[]
  ) {
    let filteredExpenses = expenses;

    if (this.filtros.estado) {
      filteredExpenses = filteredExpenses.filter(
        (expense) => expense.status === this.filtros.estado
      );
    }

    if (this.filtros.desde) {
      filteredExpenses = filteredExpenses.filter(
        (expense) => new Date(expense.issueDate) >= new Date(this.filtros.desde)
      );
    }

    if (this.filtros.hasta) {
      filteredExpenses = filteredExpenses.filter(
        (expense) => new Date(expense.issueDate) <= new Date(this.filtros.hasta)
      );
    }

    if (this.filtros.montoMinimo) {
      filteredExpenses = filteredExpenses.filter(
        (expense) =>
          expense.first_expiration_amount >= this.filtros.montoMinimo!
      );
    }

    // Sort expenses
    filteredExpenses.sort((a, b) => {
      if (a.status === 'Pendiente' && b.status !== 'Pendiente') return -1;
      if (a.status !== 'Pendiente' && b.status === 'Pendiente') return 1;
      if (a.status === 'Pago' && b.status !== 'Pago') return -1;
      if (a.status !== 'Pago' && b.status === 'Pago') return 1;

      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    });

    this.expenses = filteredExpenses;
    this.isLoading = false;
  }
}
