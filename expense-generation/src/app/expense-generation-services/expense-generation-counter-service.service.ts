import { Injectable } from '@angular/core';
import { ExpenseGenerationCounter } from '../expense-generation-interfaces/expense-generation-counter';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

type MonthMapping = {
  readonly [key: string]: string;
};

interface ApiResponse {
  transactions: ExpenseGenerationCounter[];
}


@Injectable({
  providedIn: 'root'
})
export class ExpenseGenerationCounterServiceService {
  
  private readonly API_URL: string = 'https://apimocha.com/expenses-managment/counter';
  private readonly monthMapping: MonthMapping = {
    'Enero': '01', 
    'Febrero': '02', 
    'Marzo': '03', 
    'Abril': '04',
    'Mayo': '05', 
    'Junio': '06', 
    'Julio': '07', 
    'Agosto': '08',
    'Septiembre': '09', 
    'Octubre': '10', 
    'Noviembre': '11', 
    'Diciembre': '12'
  };

  constructor(private readonly http: HttpClient) {}

  private convertSpanishPeriodToDate(period: string): string {
    const [month, year] = period.split(' ');
    return `${year}-${this.monthMapping[month]}`;
  }

  getTransactionsBetweenPeriods(startPeriod: string, endPeriod: string): Observable<ExpenseGenerationCounter[]> {
    return this.http.get<ApiResponse>(this.API_URL).pipe(
      map((response: ApiResponse): ExpenseGenerationCounter[] => {
        if (!response?.transactions) {
          console.error('Invalid API response format:', response);
          return [];
        }

        return response.transactions.filter((transaction: ExpenseGenerationCounter): boolean => {
          try {
            if (!transaction.period) {
              return false;
            }

            const normalizedPeriod: string = this.convertSpanishPeriodToDate(transaction.period);
            const transactionDate: Date = new Date(`${normalizedPeriod}-01`);
            const startDate: Date = new Date(`${startPeriod}-01`);
            const endDate: Date = new Date(`${endPeriod}-01`);

            return transactionDate >= startDate && transactionDate <= endDate;
          } catch (error) {
            console.error('Error processing transaction:', transaction, error);
            return false;
          }
        });
      }),
      catchError((error: Error): Observable<ExpenseGenerationCounter[]> => {
        console.error('Error fetching transactions:', error);
        return of([]);
      })
    );
  }
}
