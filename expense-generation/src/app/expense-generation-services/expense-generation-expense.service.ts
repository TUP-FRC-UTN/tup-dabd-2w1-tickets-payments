import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ExpenseGenerationExpenseInterface } from '../expense-generation-interfaces/expense-generation-expense-interface';

@Injectable({
  providedIn: 'root'
})
export class ExpenseGenerationExpenseService {

  
  private ApiBaseUrl = "http://localhost:8021/api/expenses/";


  constructor(private http: HttpClient) { }

  getAllExpenses(ownerId: number): Observable<ExpenseGenerationExpenseInterface[]> {
    return this.http.get<ExpenseGenerationExpenseInterface[]>(`${this.ApiBaseUrl}all?owner_id=${ownerId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error ${error.status}, ` +
        `mensaje: ${error.error.message || error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  selectedExpenses: ExpenseGenerationExpenseInterface[] = []

  addSelectedExpense(expense: ExpenseGenerationExpenseInterface){
    this.selectedExpenses.push(expense)
  }

  clearSelectedExpenses() {
    this.selectedExpenses = [];
  }

  getSelectedExpenses() {
    return this.selectedExpenses;
  }


  removeSelectedExpense(id: number){
    return  this.selectedExpenses = this.selectedExpenses.filter(expense => expense.id !== id)
  }



updateStatus(expensePaymentUpdateDTO: any): Observable<any> {
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  return this.http.put<any>(`${this.ApiBaseUrl}update/status`, expensePaymentUpdateDTO, { headers });
}

}
