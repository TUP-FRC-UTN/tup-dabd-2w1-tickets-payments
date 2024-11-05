import { Component } from '@angular/core';
import { ChartType } from 'angular-google-charts';
import { ExpenseGenerationCounterServiceService } from '../expense-generation-services/expense-generation-counter-service.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ExpenseGenerationHeaderComponent } from "../expense-generation-header/expense-generation-header.component";
import { ExpenseGenerationNavbarComponent } from "../expense-generation-navbar/expense-generation-navbar.component";
import { ExpenseGenerationCounter } from '../expense-generation-interfaces/expense-generation-counter';
import { GoogleChartsModule } from 'angular-google-charts';

@Component({
  selector: 'app-expense-generation-counter-view-2',
  standalone: true,
  imports: [GoogleChartsModule, FormsModule, CommonModule, ExpenseGenerationHeaderComponent, ExpenseGenerationNavbarComponent],
  templateUrl: './expense-generation-counter-view-2.component.html',
  styleUrl: './expense-generation-counter-view-2.component.css'
})
export class ExpenseGenerationCounterView2Component {
  counterData: ExpenseGenerationCounter[] = [];
  status: number = 0;
  periodFrom: string = this.getDefaultFromDate();
  periodTo: string = this.getCurrentYearMonth();
  paymentStatus: string = 'Aprobado';
  comparisonType: string = 'ingresos';
  morosos: number = 0;

  pieChartData: any[] = [];
  lineChartData: any[] = [];
  columnChartData: any[] = [];

  pieChartType = ChartType.PieChart;
  lineChartType = ChartType.LineChart;
  columnChartType = ChartType.ColumnChart;

  

  pieChartOptions = {
    backgroundColor: 'transparent',
    legend: {
      position: 'right',
      textStyle: { color: '#6c757d', fontSize: 17 }
    },
    chartArea: { width: '80%', height: '80%' },
    pieHole: 0.7,
    height: '80%',
    slices: {
      0: { color: '#8A2BE2' },  // MP siempre azul
      1: { color: '#00BFFF' }   // STRIPE siempre violeta
    }
  };

  lineChartOptions = {
    backgroundColor: 'transparent',
    colors: ['#24f73f'],
    legend: { position: 'none' },
    chartArea: { width: '90%', height: '80%' },
    vAxis: {
      textStyle: { color: '#6c757d' },
      format: 'currency' 
    },
    hAxis: {
      textStyle: { color: '#6c757d' }
    },
    animation: {
      duration: 1000,
      easing: 'out',
      startup: true
    }
  };

  columnChartOptions = {
    backgroundColor: 'transparent',
    colors: ['#24473f'],
    legend: { position: 'none' },
    chartArea: { width: '80%', height: '75%' },
    vAxis: {
      textStyle: { color: '#6c757d' },
      format: 'currency' 
    },
    hAxis: {
      textStyle: { color: '#6c757d' },
    },
    animation: {
      duration: 1000,
      easing: 'out',
      startup: true
    },
    height: 600,
    width: '100%',
    bar: { groupWidth: '70%' }
  };

  constructor(public counterService: ExpenseGenerationCounterServiceService) {}

  getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  getDefaultFromDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 9);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  ngOnInit() {
    this.updateCharts();
  }

  aplyFilters() {
    this.updateCharts();
  }

  private formatMonthYear(period: string): string {
    try {
      const [year, monthStr] = period.split('-');
      const month = parseInt(monthStr) - 1; 
      const date = new Date(parseInt(year), month);
      return new Intl.DateTimeFormat('es', { 
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', period, error);
      return period;
    }
  }

  private getAllMonthsInRange(): string[] {
    const months: string[] = [];
    const [startYear, startMonth] = this.periodFrom.split('-').map(Number);
    const [endYear, endMonth] = this.periodTo.split('-').map(Number);
    
    let currentDate = new Date(startYear, startMonth - 1);
    const endDate = new Date(endYear, endMonth - 1);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  }

  private updateColumnChart() {
    const months = this.getAllMonthsInRange();
    const monthlyData: { [key: string]: number } = {};
    
    // Inicializar todos los meses en 0
    months.forEach(month => {
        monthlyData[month] = 0;
    });
    
    this.counterData.forEach(transaction => {
        const normalizedPeriod = this.convertPeriodToYearMonth(transaction.period);
        if (normalizedPeriod) {
            if (this.paymentStatus === 'Aprobado') {
                // Si estamos viendo ingresos, sumamos los montos pagados
                if (transaction.amountPayed > 0) {
                    monthlyData[normalizedPeriod] = (monthlyData[normalizedPeriod] || 0) + 
                        Number(transaction.amountPayed);
                }
            } else {
                // Si estamos viendo morosos, contamos las transacciones con monto 0
                if (transaction.amountPayed === 0) {
                    monthlyData[normalizedPeriod] = (monthlyData[normalizedPeriod] || 0) + 1;
                }
            }
        }
    });
    
    // Actualizar las opciones del gráfico según el modo
    this.columnChartOptions = {
        ...this.columnChartOptions,
        colors: [this.paymentStatus === 'Aprobado' ? '#24473f' : '#dc3545'], // Verde para ingresos, rojo para morosos
        vAxis: {
            textStyle: { color: '#6c757d' },
            format: this.paymentStatus === 'Aprobado' ? 'currency' : '0', // Formato numérico simple para morosos
        }
    };
    
    this.columnChartData = months.map(month => [
        this.formatMonthYear(month),
        monthlyData[month]
    ]);
} 
 

private updateLineChart() {
  const months = this.getAllMonthsInRange();
  const monthlyData: { [key: string]: number } = {};
  
  // Inicializar todos los meses en 0
  months.forEach(month => {
    monthlyData[month] = 0;
  });
  
  // Sumar los pagos o deudas por mes según el filtro seleccionado
  this.counterData.forEach(transaction => {
    const normalizedPeriod = this.convertPeriodToYearMonth(transaction.period);
    if (normalizedPeriod) {
      if (this.paymentStatus === 'Aprobado') {
        // Para ingresos, sumamos los montos pagados
        if (transaction.amountPayed) {
          monthlyData[normalizedPeriod] = (monthlyData[normalizedPeriod] || 0) + 
            Number(transaction.amountPayed);
        }
      } else {
        // Para deudas, sumamos los firstExpirationAmount donde no hubo pago
        if (transaction.amountPayed === 0) {
          monthlyData[normalizedPeriod] = (monthlyData[normalizedPeriod] || 0) + 
            Number(transaction.firstExpirationAmount);
        }
      }
    }
  });
  
  // Actualizar las opciones del gráfico según el modo
  this.lineChartOptions = {
    ...this.lineChartOptions,
    colors: [this.paymentStatus === 'Aprobado' ? '#24f73f' : '#dc3545'], // Verde para ingresos, rojo para deudas
  };
  
  this.lineChartData = months.map(month => [
    this.formatMonthYear(month),
    monthlyData[month]
  ]);
}
  
  private updatePieChart() {
    const platforms = this.counterData.reduce((acc: {[key: string]: number}, curr) => {
      if (curr.paymentPlatform && curr.amountPayed > 0) {
        const platform = curr.paymentPlatform || 'No especificado';
        acc[platform] = (acc[platform] || 0) + Number(curr.amountPayed);
      }
      return acc;
    }, {});
  
    const total = Object.values(platforms).reduce((sum, amount) => sum + Number(amount), 0);
  
    const chartData = Object.entries(platforms)
      .filter(([_, amount]) => amount > 0)
      .map(([platform, amount]) => [
        platform === 'MERCADOPAGO' ? 'MP' : platform,
        Number(((Number(amount) / total) * 100).toFixed(1))
      ])
      .sort((a, b) => {
        // Asegurarnos que MP siempre va primero
        if (a[0] === 'MP') return 1;
        if (b[0] === 'MP') return -1;
        return 0;
      });
  
    this.pieChartData = chartData;
  }
  

  private convertPeriodToYearMonth(period: string): string {
    const monthMapping: { [key: string]: string } = {
      'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
      'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
      'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
    };
    
    const [month, year] = period.split(' ');
    return `${year}-${monthMapping[month]}`;
  }

  updateCharts() {
    this.counterService.getTransactionsBetweenPeriods(this.periodFrom, this.periodTo)
      .subscribe({
        next: (transactions) => {
          console.log('Received transactions:', transactions);
          this.counterData = transactions.map(t => ({
            ...t,
            firstExpirationAmount: Number(t.firstExpirationAmount),
            amountPayed: Number(t.amountPayed)
          }));
          this.updatePieChart();
          this.updateLineChart();
          this.updateColumnChart();
        },
        error: (error) => {
          console.error('Error al obtener transacciones:', error);
        }
      });
  }

  makeBig(nro: number) {
    this.status = nro;
  }
} 

