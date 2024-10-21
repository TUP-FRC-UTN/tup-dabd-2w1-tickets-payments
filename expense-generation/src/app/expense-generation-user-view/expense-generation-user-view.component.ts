import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ExpenseGenerationHeaderComponent } from "../expense-generation-header/expense-generation-header.component";
import { ExpenseGenerationExpenseService } from '../expense-generation-services/expense-generation-expense.service';
import { ExpenseGenerationExpenseInterface } from '../expense-generation-interfaces/expense-generation-expense-interface';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseGenerationCardComponent } from '../expense-generation-card/expense-generation-card.component';
import { ExpenseGenerationPaymentService } from '../expense-generation-services/expense-generation-payment.service';
import { response } from 'express';

@Component({
  selector: 'app-expense-generation-user-view',
  standalone: true,
  imports: [ExpenseGenerationHeaderComponent, CommonModule, FormsModule, ExpenseGenerationCardComponent],
  templateUrl: './expense-generation-user-view.component.html',
  styleUrl: './expense-generation-user-view.component.css'
})
export class ExpenseGenerationUserViewComponent implements OnInit {



  constructor(private expenseService: ExpenseGenerationExpenseService, private paymentService: ExpenseGenerationPaymentService) {

  }

  // Arreglos
  expenses$!: Observable<ExpenseGenerationExpenseInterface[]>;
  selectedExpenses: ExpenseGenerationExpenseInterface[] = [];
  paidExpenses: ExpenseGenerationExpenseInterface[] = [];
  unpaidExpenses: ExpenseGenerationExpenseInterface[] = [];

  // Filtros
  startDate: string = '';
  endDate: string = '';

  minStartDate: string = '';
  minEndDate: string = '';

  filtroEstado: string = '';

  // Variables
  total: number = 0;
  ownerId: number = 3;
  @Output() status = new EventEmitter<number>();


  ngOnInit() {

    const today = new Date();

    this.getExpensesByOwner();
    this.selectedExpenses = this.expenseService.getSelectedExpenses();
    this.calculateTotal();
    console.log(this.selectedExpenses)
  }



  getExpensesByOwner() {
    this.expenses$ = this.expenseService.getAllExpenses(this.ownerId);
    this.expenses$.subscribe(expenses => {
      this.unpaidExpenses = expenses.filter(expense => expense.status !== "Pago");
      this.paidExpenses = expenses.filter(expense => expense.status === "Pago");
      console.log(this.paidExpenses)
    });
  }



  calculateTotal() {
    this.total = this.expenseService.getSelectedExpenses().reduce((total, expense) => total + expense.first_expiration_amount, 0);

  }

  recibeAmount(amount: number) {
    this.total += amount;
  }


  changeStatusPage(num: number) {
    this.status.emit(num)
  }

  async openPdf(id: number) {
    try {
      const response = await fetch(`http://localhost:8021/api/expenses/pdf/${id}`);
      if (!response.ok) {
        alert("No se pudo cargar el pdf")
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
      if ( expense.payment_id !== null) {
        const hasLetters = /[a-zA-Z]/.test(expense.payment_id);
        if (hasLetters) {
          const response = await fetch(`http://localhost:8020/generate-receipt/${expense.payment_id}`);
          if (!response.ok) {
            alert("No se pudo cargar el pdf")
          }
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          window.open(url);
        }
        else{
          const response = await fetch(`http://localhost:8022/api/receipts/${expense.payment_id}/pdf`);
          if (!response.ok) {
            alert("No se pudo cargar el pdf")
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
    this.expenseService.getAllExpenses(this.ownerId).subscribe((expenses: ExpenseGenerationExpenseInterface[]) => {
      let filteredExpenses = expenses;

      // Aplicar filtro por fecha 'Desde'
      if (this.startDate) {
        const startDate = new Date(this.startDate);
        filteredExpenses = filteredExpenses.filter(expense => new Date(expense.issueDate) >= startDate);
      }

      // Aplicar filtro por fecha 'Hasta'
      if (this.endDate) {
        const endDate = new Date(this.endDate);
        filteredExpenses = filteredExpenses.filter(expense => new Date(expense.issueDate) <= endDate);
      }

      this.paidExpenses = filteredExpenses.filter(expense => expense.status === 'Pago');
    });
  }

  onStartDateChange() {
    if (this.startDate) {
      const startDate = new Date(this.startDate);
      const minEndDate = new Date(startDate);
      minEndDate.setMonth(startDate.getMonth() + 1); // Agregar un mes
      this.minEndDate = minEndDate.toISOString().split('T')[0]; // Ajuste de formato a 'YYYY-MM-DD'

      // Validar que la fecha 'Hasta' no sea menor a un mes desde la 'Desde'
      if (this.endDate && new Date(this.endDate) < minEndDate) {
        this.endDate = this.minEndDate; // Si es menor, ajustamos la fecha 'Hasta'
      }
      this.applyFilters();
    }



  }



  //--------------Pago de Mercado Pago-----------------


  realizarPago(expense: ExpenseGenerationExpenseInterface | null = null) {
    let paymentData: any;

    if (expense) {
      paymentData = {
        description: `Pago de boleta ${expense.id}`,
        amount: expense.first_expiration_amount,
        expenseId: expense.id,
        period: expense.period,
        ownerId: this.ownerId
      };
    } else {
      if (this.total > 0) {
        paymentData = {
          description: 'Pago de todas las boletas seleccionadas',
          amount: this.total,
          ownerId: this.ownerId
        };
      } else {
        alert('No hay boletas seleccionadas para pagar.');
        return;
      }
    }

    const observer = {
      next: (preferenceId: string) => {
        const mercadoPagoUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`;
        window.open(mercadoPagoUrl, '_blank');
      },
      error: (error: any) => {
        console.error('Error al crear la solicitud de pago:', error);
        alert('Hubo un error al procesar el pago. Inténtalo de nuevo.');
      }
    };

    this.paymentService.createPaymentRequest(paymentData).subscribe(observer);
    
  }




}
