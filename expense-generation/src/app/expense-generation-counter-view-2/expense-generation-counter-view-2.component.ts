import { Component } from '@angular/core';
import { ChartType } from 'angular-google-charts';
import { ExpenseGenerationCounterServiceService } from '../expense-generation-services/expense-generation-counter-service.service';
import { GoogleChartsModule } from 'angular-google-charts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ExpenseGenerationHeaderComponent } from "../expense-generation-header/expense-generation-header.component";
import { ExpenseGenerationNavbarComponent } from "../expense-generation-navbar/expense-generation-navbar.component";
import { ExpenseGenerationCounter } from '../expense-generation-interfaces/expense-generation-counter';
import { months } from 'moment';



// Interfaces para los KPIs
interface ColumnChartKPIs {
  totalPeriod: number;
  monthlyAverage: number;
  bestMonth: {
    month: string;
    value: number;
  };
}

interface PieChartKPIs {
  topMethod: {
    name: string;
    percentage: number;
  };
  totalTransactions: number;
  averagePerMethod: {
    [key: string]: number;
  };
}

interface LineChartKPIs {
  monthlyGrowth: number;
  maxValue: {
    month: string;
    value: number;
  };
  quarterlyTrend: number;
}


@Component({
  selector: 'app-expense-generation-counter-view-2',
  standalone: true,
  imports: [GoogleChartsModule, FormsModule, CommonModule, ExpenseGenerationHeaderComponent, ExpenseGenerationNavbarComponent],
  templateUrl: './expense-generation-counter-view-2.component.html',
  styleUrl: './expense-generation-counter-view-2.component.css'
})
export class ExpenseGenerationCounterView2Component {

  constructor(public counterService: ExpenseGenerationCounterServiceService) { }
  counterData: ExpenseGenerationCounter[] = [];


  status: number = 0;
  periodFrom: string = this.getDefaultFromDate();
  periodTo: string = this.getCurrentYearMonth();
  minDateFrom: string = '2020-01';

  paymentStatus: string = 'Aprobado';
  comparisonType: string = 'ingresos';
  morosos: number = 0;

  pieChartData: any[] = [];
  lineChartData: any[] = [];
  columnChartData: any[] = [];

  pieChartType = ChartType.PieChart;
  lineChartType = ChartType.LineChart;
  columnChartType = ChartType.ColumnChart;


  ngOnInit() {
    this.counterService.getTransactions().subscribe({
      next: (data) => {
        this.counterData = data;
        console.log('Estructura completa de datos recibidos:', JSON.stringify(data, null, 2));
        // Mostrar un ejemplo del primer registro
        if (data && data.length > 0) {
          console.log('Ejemplo de un registro:', data[0]);
          console.log('Tipo de period:', typeof data[0].period);
          console.log('Valor de period:', data[0].period);
        }
        setTimeout(() => this.aplyFilters(), 0);
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }
  // KPIs
  columnKPIs: ColumnChartKPIs = {
    totalPeriod: 0,
    monthlyAverage: 0,
    bestMonth: { month: '', value: 0 }
  };

  pieKPIs: PieChartKPIs = {
    topMethod: { name: '', percentage: 0 },
    totalTransactions: 0,
    averagePerMethod: {}
  };

  lineKPIs: LineChartKPIs = {
    monthlyGrowth: 0,
    maxValue: { month: '', value: 0 },
    quarterlyTrend: 0
  };


  pieChartOptions = {
    backgroundColor: 'transparent',
    legend: {
      position: 'right',
      textStyle: { color: '#6c757d', fontSize: 17 }
    },
    chartArea: { width: '100%', height: '100%' },
    pieHole: 0.7,
    height: '80%',
    slices: {
      0: { color: '#00BFFF' },  // MP siempre azul
      1: { color: '#8A2BE2' },  // STRIPE siempre violeta
      2: { color: '#ACE1AF' }   // EFECTIVO siempre verde
    },
    pieSliceTextStyle: {
      color: 'black',
      fontSize: 18
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
      textStyle: {
        color: '#6c757d',
        fontSize: 12  // Tamaño de fuente más pequeño
      },
      // Formato personalizado para mostrar los valores en miles
      format: 'currency',
      formatOptions: {
        // Muestra solo miles, sin decimales
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 0
      }
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


  getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  getDefaultFromDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 9);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  aplyFilters() {
    this.updateColumnChart();
    this.updateLineChart();
    this.updatePieChart();
  }

  private formatMonthYear(period: string): string {
    if (!period || !period.includes('-')) {
      console.warn('Invalid period format:', period);
      return 'Invalid Date';
    }

    try {
      const [year, month] = period.split('-');
      if (!year || !month) {
        console.warn('Invalid period parts:', { year, month });
        return 'Invalid Date';
      }

      const date = new Date(parseInt(year), parseInt(month) - 1);

      if (isNaN(date.getTime())) {
        console.warn('Invalid date created:', date);
        return 'Invalid Date';
      }

      return new Intl.DateTimeFormat('es', {
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', period, error);
      return 'Invalid Date';
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
    if (!this.counterData || !Array.isArray(this.counterData) || this.counterData.length === 0) {
      console.warn('No hay datos para mostrar en el gráfico');
      return;
    }

    const months = this.getAllMonthsInRange();
    const monthlyData: { [key: string]: number } = {};

    // Inicializar datos mensuales
    months.forEach(month => {
      monthlyData[month] = 0;
    });

    // Procesar transacciones
    this.counterData.forEach(transaction => {
      const normalizedPeriod = transaction.period;
      if (normalizedPeriod && monthlyData.hasOwnProperty(normalizedPeriod)) {
        if (this.paymentStatus === 'Aprobado') {
          // Contar pagos realizados
          if (transaction.amountPayed && transaction.amountPayed > 0) {
            monthlyData[normalizedPeriod] += Number(transaction.amountPayed) / 1000;
          }
        } else {
          // Contar morosos (status PENDIENTE o amountPayed es null)
          if (transaction.status === 'PENDIENTE' || transaction.amountPayed === null) {
            monthlyData[normalizedPeriod] += 1;
          }
        }
      }
    });

    // Crear datos para el gráfico
    this.columnChartData = months.map(month => [
      this.formatMonthYear(month),
      monthlyData[month] || 0
    ]);

    // Actualizar KPIs
    const values = Object.values(monthlyData).filter(val => !isNaN(val));
    this.columnKPIs = {
      totalPeriod: values.reduce((sum, val) => sum + val, 0),
      monthlyAverage: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
      bestMonth: Object.entries(monthlyData).reduce(
        (best, [month, value]) => {
          return !isNaN(value) && value > best.value ?
            { month: this.formatMonthYear(month), value } :
            best;
        },
        { month: '', value: 0 }
      )
    };

    // Actualizar opciones del gráfico
    this.columnChartOptions = {
      ...this.columnChartOptions,
      colors: [this.paymentStatus === 'Aprobado' ? '#40916c' : '#9d0208']
    };
  }

  private updateLineChart() {
    const months = this.getAllMonthsInRange();
    const monthlyData: { [key: string]: number } = {};

    // Inicializar los datos mensuales
    months.forEach(month => {
      monthlyData[month] = 0;
    });

    // Procesar las transacciones
    this.counterData.forEach(transaction => {
      const normalizedPeriod = this.convertPeriodToYearMonth(transaction.period);
      if (normalizedPeriod && months.includes(normalizedPeriod)) {
        if (this.paymentStatus === 'Aprobado') {
          if (transaction.amountPayed) {
            monthlyData[normalizedPeriod] = (monthlyData[normalizedPeriod] || 0) +
              Number(transaction.amountPayed);
          }
        } else {
          if (transaction.amountPayed === null || transaction.amountPayed === 0 || transaction.status === 'PENDIENTE') {
            monthlyData[normalizedPeriod] = (monthlyData[normalizedPeriod] || 0) +
              Number(transaction.firstExpirationAmount);
          }
        }
      }
    });

    // Preparar datos para el gráfico
    this.lineChartData = months.map(month => [
      this.formatMonthYear(month),
      monthlyData[month]
    ]);

    // Actualizar opciones del gráfico
    this.lineChartOptions = {
      ...this.lineChartOptions,
      colors: [this.paymentStatus === 'Aprobado' ? '#24f73f' : '#dc3545'],
    };

    // Calcular KPIs
    const monthlyValues = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, value]) => value);

    // 1. Crecimiento Mensual
    if (monthlyValues.length >= 2) {
      const lastMonth = monthlyValues[monthlyValues.length - 1];
      const previousMonth = monthlyValues[monthlyValues.length - 2];
      this.lineKPIs.monthlyGrowth = previousMonth !== 0 ? 
        ((lastMonth - previousMonth) / previousMonth) * 100 : 0;
    } else {
      this.lineKPIs.monthlyGrowth = 0;
    }

    // 2. Valor Máximo
    const maxValue = Math.max(...Object.values(monthlyData));
    const maxMonth = Object.entries(monthlyData)
      .find(([_, value]) => value === maxValue)?.[0] || '';
    this.lineKPIs.maxValue = {
      month: this.formatMonthYear(maxMonth),
      value: maxValue
    };

    // 3. Tendencia Trimestral
    if (monthlyValues.length >= 3) {
      const lastThreeMonths = monthlyValues.slice(-3);
      const avgLastThree = lastThreeMonths.reduce((sum, val) => sum + val, 0) / 3;
      const previousThreeMonths = monthlyValues.slice(-6, -3);
      
      if (previousThreeMonths.length === 3) {
        const avgPreviousThree = previousThreeMonths.reduce((sum, val) => sum + val, 0) / 3;
        this.lineKPIs.quarterlyTrend = avgPreviousThree !== 0 ?
          ((avgLastThree - avgPreviousThree) / avgPreviousThree) * 100 : 0;
      } else {
        this.lineKPIs.quarterlyTrend = 0;
      }
    } else {
      this.lineKPIs.quarterlyTrend = 0;
    }
}

  private updatePieChart() {
    // Filtrar solo las transacciones del período seleccionado
    const filteredData = this.counterData.filter(transaction => {
      const transactionPeriod = this.convertPeriodToYearMonth(transaction.period);
      return transactionPeriod >= this.periodFrom && transactionPeriod <= this.periodTo;
    });

    // Agrupar por plataforma de pago y contar transacciones
    const platformCounts = filteredData.reduce((acc: { [key: string]: number }, curr) => {
      if (curr.amountPayed > 0) {
        const platform = curr.paymentPlatform || 'EFECTIVO';
        acc[platform] = (acc[platform] || 0) + 1; // Contar transacciones en lugar de sumar montos
      }
      return acc;
    }, {});

    // Calcular el total de transacciones
    const totalTransactions = Object.values(platformCounts).reduce((sum, count) => sum + count, 0);

    // Convertir conteos a porcentajes
    const chartData = Object.entries(platformCounts)
      .map(([platform, count]) => {
        const percentage = (count / totalTransactions) * 100;
        return [
          platform === 'MERCADOPAGO' ? 'Mp' :
            platform === 'EFECTIVO' ? 'Efectivo' : platform,
          Number(percentage.toFixed(2)) // Redondear a 2 decimales
        ];
      })
      .sort((a, b) => {
        // Mantener el orden específico: MP, STRIPE, EFECTIVO
        const order = { 'Mp': 0, 'STRIPE': 1, 'Efectivo': 2 };
        return (order[a[0] as keyof typeof order] || 0) - (order[b[0] as keyof typeof order] || 0);
      });

    this.pieChartData = chartData;

    // Actualizar KPIs
    const methodTotals: { [key: string]: { sum: number, count: number } } = {};

    filteredData.forEach(transaction => {
      if (transaction.amountPayed > 0) {
        const platform = transaction.paymentPlatform || 'EFECTIVO';
        if (!methodTotals[platform]) {
          methodTotals[platform] = { sum: 0, count: 0 };
        }
        methodTotals[platform].sum += transaction.amountPayed;
        methodTotals[platform].count++;
      }
    });

    this.pieKPIs = {
      topMethod: {
        name: Object.entries(methodTotals)
          .sort((a, b) => b[1].count - a[1].count)[0]?.[0] || '',
        percentage: (Object.entries(methodTotals)
          .sort((a, b) => b[1].count - a[1].count)[0]?.[1].count / totalTransactions) * 100 || 0
      },
      totalTransactions,
      averagePerMethod: Object.fromEntries(
        Object.entries(methodTotals).map(([method, data]) =>
          [method, data.sum / data.count]
        )
      )
    };
  }

  private convertPeriodToYearMonth(period: any): string {
    if (!period) {
      console.warn('Period inválido:', period);
      return '';
    }

    try {
      // Si el periodo ya está en formato YYYY-MM, lo devolvemos directamente
      if (typeof period === 'string' && /^\d{4}-\d{2}$/.test(period)) {
        return period;
      }

      // Si no, intentamos el formato anterior (Mes Año)
      const monthMapping: { [key: string]: string } = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
        'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
        'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
        'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
      };

      const [month, year] = period.toString().trim().split(' ');
      if (monthMapping[month]) {
        return `${year}-${monthMapping[month]}`;
      }

      return '';
    } catch (error) {
      console.warn('Error al convertir periodo:', period, error);
      return '';
    }
  }

  makeBig(nro: number) {
    this.status = nro;
  }
}