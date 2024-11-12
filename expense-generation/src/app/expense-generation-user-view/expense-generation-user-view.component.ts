import {Component, EventEmitter, inject, OnInit, Output} from '@angular/core';
import { ExpenseGenerationExpenseService } from '../expense-generation-services/expense-generation-expense.service';
import { ExpenseGenerationExpenseInterface } from '../expense-generation-interfaces/expense-generation-expense-interface';
import { Observable } from 'rxjs';
import {CommonModule, DatePipe, registerLocaleData} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseGenerationCardComponent } from '../expense-generation-card/expense-generation-card.component';
import { ExpenseGenerationPaymentService } from '../expense-generation-services/expense-generation-payment.service';
import {Router, RouterLink} from '@angular/router';
import localeEsAr from '@angular/common/locales/es-AR';
import { ExpenseGenerationNavbarComponent } from "../expense-generation-navbar/expense-generation-navbar.component";
registerLocaleData(localeEsAr, 'es-AR');
@Component({
  selector: 'app-expense-generation-user-view',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    ExpenseGenerationCardComponent,
    ExpenseGenerationNavbarComponent
],
  providers: [DatePipe],
  templateUrl: './expense-generation-user-view.component.html',
  styleUrl: './expense-generation-user-view.component.css',
})
export class ExpenseGenerationUserViewComponent implements OnInit {

   Math = Math;

  constructor(
    private expenseService: ExpenseGenerationExpenseService,
    private paymentService: ExpenseGenerationPaymentService,
    private router:Router,
    private datePipe:DatePipe
  ) {}

  // Arreglos
  expenses$!: Observable<ExpenseGenerationExpenseInterface[]>;
  selectedExpenses: ExpenseGenerationExpenseInterface[] = [];
  paidExpenses: ExpenseGenerationExpenseInterface[] = [];
  unpaidExpenses: ExpenseGenerationExpenseInterface[] = [];
  expenses: ExpenseGenerationExpenseInterface[] = [];


  // Filtros
  startDate: string = '';
  endDate: string = '';
  minAmount: number | null = null;
  maxAmount: number | null = null;
  maxEndDate: string = '';

  minEndDate: string = '';
  modalState: boolean = false;

  // Variables
  total: number = 0;
  ownerId: number = 3;
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  pagedExpenses: any[] = [];
  visiblePages: number[] = [];
  @Output() status = new EventEmitter<number>();

  ngOnInit() {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    this.endDate = localDate.toISOString().split('T')[0];
    this.maxEndDate = localDate.toISOString().split('T')[0];
    this.startDate = new Date(localDate.getFullYear(),0,1).toISOString().split('T')[0];
    this.getExpensesByOwner();
    this.selectedExpenses = this.expenseService.getSelectedExpenses();
    this.calculateTotal();
  }

  goToPaymentForm(){
    this.router.navigateByUrl("expense-generation-payment-form")
  }

  getExpensesByOwner() {
    this.expenses$ = this.expenseService.getAllExpenses(this.ownerId);
    this.expenses$.subscribe((expenses) => {
      this.unpaidExpenses = expenses.filter(
        (expense) => expense.status !== 'Pago'
      );
      this.paidExpenses = expenses.filter(
        (expense) => expense.status === 'Pago'
      );
      console.log(this.paidExpenses);
    });
  }

  calculateTotal() {
    this.total = this.expenseService
      .getSelectedExpenses()
      .reduce((total, expense) => total + expense.actual_amount, 0);
  }

  recibeAmount(amount: number) {
    this.total += amount;
  }

  changeStatusPage(num: number) {
    this.status.emit(num);
  }

  async openPdf(uuid: string) {
    try {
      const response = await fetch(
        `http://localhost:8021/api/expenses/pdf/${uuid}`
      );
      if (!response.ok) {
        alert('No se pudo cargar el pdf');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      console.error('There was an error opening the PDF:', error);
    }
  }

  async openReceipt(expense: ExpenseGenerationExpenseInterface) {
    try {
      if (expense.payment_id !== null) {
        const hasLetters = /[a-zA-Z]/.test(expense.payment_id);
        if (hasLetters) {
          const response = await fetch(
            `http://localhost:8020/generate-receipt/${expense.payment_id}`
          );
          if (!response.ok) {
            alert('No se pudo cargar el pdf');
          }
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          window.open(url);
        } else {
          const response = await fetch(
            `http://localhost:8022/api/receipts/${expense.payment_id}/pdf`
          );
          if (!response.ok) {
            alert('No se pudo cargar el pdf');
          }
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          window.open(url);
        }
      }
    } catch (error) {
      console.error('There was an error opening the PDF:', error);
    }
  }

  applyFilters() {
    this.expenseService
      .getAllExpenses(this.ownerId)
      .subscribe((expenses: ExpenseGenerationExpenseInterface[]) => {
        let filteredExpenses = expenses;
        if (this.startDate) {
          const startDate = new Date(this.startDate);
          filteredExpenses = filteredExpenses.filter(
            (expense) => new Date(expense.issueDate) >= startDate
          );
        }

        if (this.endDate) {
          const endDate = new Date(this.endDate);
          filteredExpenses = filteredExpenses.filter(
            (expense) => new Date(expense.issueDate) <= endDate
          );
        }

         // Filtro por importe
         if (this.minAmount !== null) {
          filteredExpenses = filteredExpenses.filter(
            (expense) => expense.amount_payed >= this.minAmount!
          );
        }

        if (this.maxAmount !== null) {
          filteredExpenses = filteredExpenses.filter(
            (expense) => expense.amount_payed <= this.maxAmount!
          );
        }

        this.paidExpenses = filteredExpenses.filter(
          (expense) => expense.status === 'Pago'
        );
      });
  }

  onStartDateChange() {
    if (this.startDate) {
      const startDate = new Date(this.startDate);
      const minEndDate = new Date(startDate);
      minEndDate.setMonth(startDate.getMonth() + 1);
      this.minEndDate = minEndDate.toISOString().split('T')[0];
      if (this.endDate && new Date(this.endDate) < minEndDate) {
        this.endDate = this.minEndDate;
      }
      this.applyFilters();
    }
  }


  onItemsPerPageChange() {
    this.currentPage = 1;
    this.calculateTotalPages();
    this.updateVisiblePages();
    this.updatePagedExpenses();
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  updateVisiblePages() {
    const maxVisiblePages = 3;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    // Ajustar startPage si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    this.visiblePages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }

  updatePagedExpenses() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.totalItems);
    this.pagedExpenses = this.expenses.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updateVisiblePages();
      this.updatePagedExpenses();
    }
  }



  //--------------Pago de Mercado Pago----------------
  payWithMP(expenses: ExpenseGenerationExpenseInterface[]) {
    if (!expenses || expenses.length === 0) {
      alert('Error: No se proporcionaron boletas válidas para pagar.');
      return;
    }

    // Calcular monto total y crear array de detalles por expensa
    const expenseDetails = expenses.map((expense) => ({
      expense_id: parseInt(expense.id.toString()),
      amount:
        typeof expense.actual_amount === 'string'
          ? parseFloat(expense.actual_amount)
          : expense.actual_amount,
    }));

    const totalAmount = expenseDetails.reduce(
      (sum, detail) => sum + detail.amount,
      0
    );
    const initialString:string = expenseDetails.length>1 ? "Pago de las boletas de los periodos:" : "Pago de la boleta del periodo:";

    const description = `${initialString} ${expenses
      .map((exp) => this.datePipe.transform(exp.period,"MM-yyyy")  )
      .join(', ')}`;

    const paymentData = {
      description: description,
      amount: totalAmount,
      details: expenseDetails,
      ownerId: this.ownerId,
    };

    console.log(paymentData);
    this.paymentService.createPaymentRequest(paymentData).subscribe({
      next: (preferenceId: string) => {
        const mercadoPagoUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`;
        window.open(mercadoPagoUrl, '_blank');
      },
      error: (error: any) => {
        console.error('Error al crear la solicitud de pago múltiple:', error);
        alert('Hubo un error al procesar el pago. Inténtalo de nuevo.');
      },
    });
  }
}
