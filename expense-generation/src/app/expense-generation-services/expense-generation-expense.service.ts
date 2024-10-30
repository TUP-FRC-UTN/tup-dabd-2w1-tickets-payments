import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, mergeMap, Observable, throwError } from 'rxjs';
import { ExpenseGenerationExpenseInterface } from '../expense-generation-interfaces/expense-generation-expense-interface';
import { Owner } from '../expense-generation-interfaces/owner';
@Injectable({
  providedIn: 'root'
})
export class ExpenseGenerationExpenseService {
  

  
  private ApiBaseUrl = "http://localhost:8021/api/expenses/";
  private ApiParaTraerTodosLosOwners =  "http://localhost:8021/api/v1/owners/active"
  private ApiParaTraerunOwner =  "http://localhost:8021/api/v1/owners/"

  constructor(private http: HttpClient) { }

  getAllExpenses(ownerId: number): Observable<ExpenseGenerationExpenseInterface[]> {
    return this.http.get<ExpenseGenerationExpenseInterface[]>(`${this.ApiBaseUrl}all?owner_id=${ownerId}`).pipe(
      catchError(this.handleError)
    );
  }
  GetOwnerById(id: number): Observable<Owner> {
    if (id === undefined || id === null) {
        console.error('ID no válido para GetOwnerById:', id);
        return throwError(() => 'ID de owner es inválido');
    }
    const url = `${this.ApiParaTraerunOwner}${id}`;
    return this.http.get<Owner>(url).pipe(
        catchError(this.handleError)
    );
  }
  getAllOwnersWithExpenses(): Observable<{ owner: Owner; expenses: ExpenseGenerationExpenseInterface[] }[]> {
    return this.getAllOwners().pipe(
      map(owners => owners.filter(owner => owner.active)), 
      mergeMap(owners => {
        const ownerExpensesRequests = owners.map(owner => 
          this.getAllExpenses(owner.id).pipe(
            map(expenses => ({
              owner: owner,
              expenses: expenses
            })),
            catchError(error => {
              console.error(`Error fetching expenses for owner ${owner.id}:`, error);
              return [{ owner: owner, expenses: [] }];
            })
          )
        );
        return forkJoin(ownerExpensesRequests);
      }),
      catchError(error => {
        console.error('Error in getAllOwnersWithExpenses:', error);
        return throwError(() => error);
      })
    );
  }
  private handleError(error: HttpErrorResponse) {
  let errorMessage = 'Ocurrió un error desconocido';
  
  // Simplificar el manejo de errores
  if (error.status === 0) {
    errorMessage = 'Error de conexión con el servidor';
  } else {
    errorMessage = error.error?.message || error.message || 'Error en el servidor';
  }
  
  console.error('Error en la petición:', errorMessage);
  return throwError(() => errorMessage);
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

  getAllExpensesForAllOwners(): Observable<ExpenseGenerationExpenseInterface[]> {
    return this.http.get<ExpenseGenerationExpenseInterface[]>(`${this.ApiParaTraerTodosLosOwners}`).pipe(
      catchError(this.handleError)
    );
  }
  getAllOwners(): Observable<Owner[]> {
    return this.http.get<Owner[]>(`${this.ApiParaTraerTodosLosOwners}`).pipe(
      catchError(this.handleError)
    );
  }
  getAllOwnersByhisExpenses(): Observable<Owner[]> {
    return this.http.get<Owner[]>(`${this.ApiParaTraerTodosLosOwners}`).pipe(
      catchError(this.handleError)
    );
  }
  removeSelectedExpense(id: number){
    return  this.selectedExpenses = this.selectedExpenses.filter(expense => expense.id !== id)
  }
getActiveOwners(): Observable<any[]> {
  return this.http.get<any[]>(`http://localhost:8021/api/v1/owners/active`);
}




updateStatus(expensePaymentUpdateDTO: any): Observable<any> {
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  return this.http.put<any>(`${this.ApiBaseUrl}update/status`, expensePaymentUpdateDTO, { headers });
}

}
