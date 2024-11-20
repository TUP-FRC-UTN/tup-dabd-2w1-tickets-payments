import { Component } from '@angular/core';
import { ChartType } from 'angular-google-charts';
import { GoogleChartsModule } from 'angular-google-charts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { CustomKpiComponent } from '../../common/components/custom-kpi/custom-kpi.component';
import { ExpenseGenerationCounter, Kpi, DebtorInfo, PaymentMethod } from '../expense-generation-interfaces/expense-generation-accountant';
import { DebtorExpense } from '../expense-generation-interfaces/expense-generation-expense-interface';
import { Owner } from '../expense-generation-interfaces/expense-generation-owner';
import { ExpenseGenerationCounterServiceService } from '../expense-generation-services/expense-generation-counter-service.service';
import { ExpenseGenerationExpenseService } from '../expense-generation-services/expense-generation-expense.service';


@Component({
  selector: 'app-expense-generation-counter-view-2',
  standalone: true,
  imports: [GoogleChartsModule, NgSelectModule, FormsModule, CommonModule, CustomKpiComponent],
  templateUrl: './expense-generation-counter-view-2.component.html',
  styleUrl: './expense-generation-counter-view-2.component.css'
})
export class ExpenseGenerationCounterView2Component {

  constructor(public counterService: ExpenseGenerationCounterServiceService, public expenseService: ExpenseGenerationExpenseService) {
  }
  counterData: ExpenseGenerationCounter[] = [];

  
  debtorExpenses: DebtorExpense[] = []
  ownerName: string = ''
  owners: Owner[] = [];
  status: number = 0;
  periodFrom: string = this.getDefaultFromDate();
  periodTo: string = this.getCurrentYearMonth();
  minDateFrom: string = '2020-01';
  topMethodName: string = "";
  paymentMethods: PaymentMethod[] = [];
  selectedPaymentMethods: string[] = [];


  columnPaymentStatus: string = 'Aprobado';
  pieApprovalStatus: string = 'Aprobado';
  comparisonType: string = 'ingresos';
  morosos: number = 0;

  transactionType: 'approved' | 'rejected' = 'approved';
  debtRangeMin: number = 0;
  debtRangeMax: number = Infinity;



  // Kpis pantalla principal
  principalKpis: Kpi[] = [
    {
      amount: 0,
      title: 'Total de ingresos',
      subTitle: 'Periodos Seleccionados',
      tooltip: 'total de ingresos en los periodos seleccionados',
      customStyles: {
        'background-color': '#b3f5bc',
        'color': '#000000'
      },
      icon: 'bi bi-bar-chart-line',
      formatPipe: 'currency'
    },
    {
      amount: 0,
      title: 'Total de deudas',
      subTitle: 'Periodos Seleccionados',
      tooltip: 'total de deudas en los meses seleccionados',
      customStyles: {
        'background-color': '#f49189',
        'color': '#000000'
      },
      icon: 'bi bi-bar-chart-line',
      formatPipe: 'currency'
    },
    {
      amount: 0,
      title: 'Cantidad de morosos',
      subTitle: '',
      tooltip: 'cantidad de deudores al dia de hoy',
      customStyles: {
        'background-color': '#f49189',
        'color': '#000000'
      },
      icon: '',
      formatPipe: ''
    },
    {
      amount: 0,
      title: 'Plataforma de pago mas utilizado',
      subTitle: '',
      tooltip: 'Medio de pago mas utilizado',
      customStyles: {
        'background-color': '#D1BDFF',
        'color': '#000000'
      },
      icon: '',
      formatPipe: ''
    }
  ]
  //Kpis grafico de pie 
  pieKpis: Kpi[] = [
    {
      amount: 0,
      title: 'Total Transacciones',
      subTitle: 'Periodos Seleccionados',
      tooltip: 'Número total de transacciones realizadas en los periodos seleccionados',
      customStyles: {
        'background-color': '#d6f6ff',
        'color': '#000000'
      },
      icon: 'bi bi-bar-chart-line',
      formatPipe: ''
    },
    {
      amount: 0,
      title: 'Transacciones Aprobadas',
      subTitle: 'Periodos Seleccionados',
      tooltip: 'Número de transacciones aprobadas en los periodos seleccionados',
      customStyles: {
        'background-color': '#b3f5bc',
        'color': '#000000'
      },
      icon: 'bi bi-check-circle',
      formatPipe: ''
    },
    {
      amount: 0,
      title: 'Transacciones Rechazadas',
      subTitle: 'Periodos Seleccionados',
      tooltip: 'Número de transacciones rechazadas en los periodos seleccionados',
      customStyles: {
        'background-color': '#fa9189',
        'color': '#000000'
      },
      icon: 'bi bi-x-circle',
      formatPipe: ''
    }
  ]
  //Kpi grafico de columnas
  columnKpis: Kpi[] = [
    {
      amount: 0,
      title: 'Ingresos Proyectados',
      subTitle: 'Total facturado',
      tooltip: 'Total facturado en los periodos seleccionados',
      customStyles: {
        'background-color': '#d6f6ff',
        'color': '#000000'
      },
      icon: '',
      formatPipe: 'currency'
    },
    {
      amount: 0,
      title: 'Desviación',
      subTitle: 'Diferencia entre cobrado y facturado',
      tooltip: 'Monto no cobrado del total facturado',
      customStyles: {
        'background-color': '#f49189',
        'color': '#000000'
      },
      icon: '',
      formatPipe: 'currency'
    },
    {
      amount: 0,
      title: 'Mejor Mes',
      subTitle: '',
      tooltip: 'Mes con mayor ingreso realizado',
      customStyles: {
        'background-color': '#d6f6ff',
        'color': '#000000'
      },
      icon: '',
      formatPipe: 'currency'
    },
    {
      amount: 0,
      title: 'Ingresos Realizados',
      subTitle: 'Total cobrado',
      tooltip: 'Total efectivamente cobrado en los periodos seleccionados',
      customStyles: {
        'background-color': '#b3f5bc',
        'color': '#000000'
      },
      icon: '',
      formatPipe: 'currency'
    }
  ]
  // Kpi de top 5
  topFiveKpi: Kpi[] = [
    {
      amount: 0,
      title: 'Antigüedad Promedio de Deudas',
      subTitle: 'Top 5 Morosos',
      tooltip: 'Promedio de días de antigüedad de las deudas del período seleccionado',
      customStyles: {
        'background-color': '#ffe699',
        'color': '#000000'
      },
      icon: 'bi bi-calendar-x',
      formatPipe: 'percent'
    },
    {
      amount: 0,
      title: 'Promedio Días Adeudados',
      subTitle: 'Top 5 Morosos',
      tooltip: 'Promedio de días que adeudan los morosos en el período seleccionado',
      customStyles: {
        'background-color': '#ffe699',
        'color': '#000000'
      },
      icon: 'bi bi-calendar-check',
      formatPipe: 'percent'
    },
    {
      amount: 0,
      title: 'Total Adeudado Top 5',
      subTitle: 'Morosos',
      tooltip: 'Suma total de deudas de los 5 principales morosos',
      customStyles: {
        'background-color': '#ffe699',
        'color': '#000000'
      },
      icon: 'bi bi-cash-stack',
      formatPipe: 'currency'
    }
  ]


  top5ApprovalStatus: string = 'all';

  pieChartData: any[] = [];
  columnChartData: any[] = [];
  top5Data: DebtorInfo[] = [];


  pieChartType = ChartType.PieChart;
  columnChartType = ChartType.ColumnChart;

  pieChartOptions = {
    backgroundColor: 'transparent',

    legend: {
      position: 'right',
      textStyle: { color: '#6c757d', fontSize: 17 }
    },
    chartArea: { width: '100%', height: '100%' },
    pieHole: 0,
    height: '100%',
    slices: {
      0: { color: '#be95c4' },  // MP siempre azul
      1: { color: '#00b4d8' },  // STRIPE siempre violeta
      2: { color: '#80ed99' }   // EFECTIVO siempre verde
    },
    pieSliceTextStyle: {
      color: 'white',
      fontSize: 18
    }
  };

  columnChartOptions = {
    backgroundColor: 'transparent',
    colors: ['#709775', '#64b6ac'], // Verde para cobrado, Azul claro para facturado
    legend: {
      display: true,
      position: 'top',
      alignment: 'center',
      textStyle: {
        color: '#6c757d',
        fontSize: 12
      },
    },
    chartArea: {
      width: '85%',
      height: '70%',
      top: 60
    },
    vAxis: {
      title: 'Miles de pesos (ARS)',
      textStyle: {
        color: '#6c757d',
        fontSize: 12
      },
      format: 'decimal', // Cambiar de currency a decimal
      viewWindow: {
        min: 0,
      },
      ticks: {
        // Personaliza las etiquetas en el eje Y para mostrar "Mil"
        callback: (value: number) => {
          return '$' + (value / 1000) + 'Mil'; // Dividir por 1000 y agregar "Mil"
        }
      }
    },
    hAxis: {
      title: 'Periodo',
      format: 'MMM yyyy',
      textStyle: { color: '#6c757d' }
    },
    animation: {
      duration: 1000,
      easing: 'out',
      startup: true
    },
    width: '100%',
    height: '75%',
    bar: { groupWidth: '70%' },
    seriesType: 'bars',
    series: {
      1: { targetAxisIndex: 0, label: 'Facturado' },
      0: { targetAxisIndex: 0, label: 'Cobrado' }
    },

  };

  ngOnInit() {
    this.loadOwners();
    this.counterService.getTransactions().subscribe({
      next: (data: ExpenseGenerationCounter[]) => {
        this.counterData = data;
        this.loadPaymentMethods();
        setTimeout(() => this.applyFilters(), 0);
      },
      error: (error: any) => {
        console.error('Error:', error);
      }
    });

    console.log(this.owners)
  }


  //-----| Estos tres metodos son para el select de metodos de pago |-----------------
  private loadPaymentMethods() {
    this.paymentMethods = [
      { id: '1', name: 'Efectivo' },
      { id: '2', name: 'Stripe' },
      { id: '3', name: 'MercadoPago' }
    ];

    // Formatear los métodos de pago para el custom select
    this.formattedPaymentMethods = this.paymentMethods.map(method => ({
      value: method.id,
      name: method.name
    }));
  }

  selectOwner(id: number, name: string) {
    this.expenseService.getAllExpenses(id).subscribe((expenses) => {
      this.debtorExpenses = expenses
        .filter((expense) => expense.status !== 'Pago')
        .map((expense) => ({
          owner_id : expense.owner_id,
          ownerName: name,
          period: expense.period,
          uuid: expense.uuid,
          second_expiration_date: expense.second_expiration_date,
          second_expiration_amount: expense.second_expiration_amount,
          actual_amount: expense.actual_amount,
        } as DebtorExpense));
    });
    this.ownerName = name;
  }

  formattedPaymentMethods: { value: string, name: string }[] = [];


  onPaymentMethodChange(selectedValues: string[]) {
    this.selectedPaymentMethods = selectedValues;
    this.updateDashboard();
  }

  //------------------------------------------------------------------------------------

  // Método para cargar propietarios
  private loadOwners() {
    this.expenseService.getAllOwners().subscribe({
      next: (owners) => {
        this.owners = owners;
      },
      error: (error) => {
        console.error('Error al cargar propietarios:', error);
      }
    });
  }

  private calculateDaysOverdue(secondExpirationDate: number[]): number {
    if (!secondExpirationDate || secondExpirationDate.length !== 3) {
      return 0;
    }

    const expDate = new Date(
      secondExpirationDate[0],
      secondExpirationDate[1] - 1,
      secondExpirationDate[2]
    );
    const today = new Date();
    const diffTime = today.getTime() - expDate.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  private processTop5Debtors(): DebtorInfo[] {
    const debtorsMap = new Map<number, DebtorInfo>();
    const debtors: DebtorInfo[] = [];
    
    const filteredData = this.counterData.filter(transaction => {
      const transactionPeriod = this.convertPeriodToYearMonth(transaction.period);
      return transactionPeriod >= this.periodFrom && 
             transactionPeriod <= this.periodTo;
    });
  
    filteredData.forEach(transaction => {
      const owner = this.owners.find(o => o.id === transaction.ownerId);
      const currentDebtorInfo = debtorsMap.get(transaction.ownerId) || {
        ownerId: transaction.ownerId,
        ownerName: owner ? `${owner.name} ${owner.lastname}`: 'Desconocido',
        totalDebt: 0,
        oldestDebtDays: 0,
        averageDebtDays: 0,
        totalBills: 0,
        unpaidBills: 0,
        oldestDebtDate: undefined
      };
  
      currentDebtorInfo.totalBills++;
  
      if (transaction.status !== 'PAGO') {
        const daysOverdue = this.calculateDaysOverdue(transaction.secondExpirationDate);
        const debtDate = new Date(
          transaction.secondExpirationDate[0],
          transaction.secondExpirationDate[1] - 1,
          transaction.secondExpirationDate[2]
        );
  
        currentDebtorInfo.totalDebt += transaction.firstExpirationAmount;
        currentDebtorInfo.unpaidBills++;
  
        if (!currentDebtorInfo.oldestDebtDate || debtDate < currentDebtorInfo.oldestDebtDate) {
          currentDebtorInfo.oldestDebtDate = debtDate;
          currentDebtorInfo.oldestDebtDays = daysOverdue;
        }
  
        const currentTotalDays = currentDebtorInfo.averageDebtDays * (currentDebtorInfo.unpaidBills - 1);
        currentDebtorInfo.averageDebtDays = 
          (currentTotalDays + daysOverdue) / currentDebtorInfo.unpaidBills;
      }
  
      debtorsMap.set(transaction.ownerId, currentDebtorInfo);
      debtors.push(currentDebtorInfo)
    });

    this.top5Data = debtors;
    console.log(this.top5Data);
  
    return Array.from(debtorsMap.values())
      .filter(debtor => {
        const meetsDebtRange = 
          debtor.totalDebt >= this.debtRangeMin && 
          debtor.totalDebt <= this.debtRangeMax;
        
        const hasUnpaidBills = debtor.unpaidBills > 0;
        
        return meetsDebtRange && hasUnpaidBills;
      })
      .sort((a, b) => {
        const debtDiff = b.totalDebt - a.totalDebt;
        if (debtDiff !== 0) return debtDiff;
        
        return b.oldestDebtDays - a.oldestDebtDays;
      })
      .slice(0, 5); // Tomar solo los top 5
  }

  onTransactionTypeChange(type: 'approved' | 'rejected') {
    this.transactionType = type;
    this.pieApprovalStatus = type === 'approved' ? 'Aprobado' : 'Rechazado';
    this.applyFilters();
  }

  onDebtRangeChange(min: number, max: number) {
    this.debtRangeMin = min ?? 0;
    this.debtRangeMax = max ?? Infinity;
    this.applyFilters(); 
  }

  getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  getDefaultFromDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 9);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  applyFilters() {
    this.updateDashboard();
    this.updatePieChart();
    this.updatePrincipalKpis();
    this.updateTop5Debtors();  
  }


  private updateDashboard() {
    const monthlyData = this.processMonthlyData();
    this.updateKPIs(monthlyData);
    this.updateChart(monthlyData);
  }

  private processMonthlyData() {
    const months = this.getAllMonthsInRange();
    const monthlyData: { [key: string]: { income: number; projected: number } } = {};

    months.forEach(month => {
      monthlyData[month] = { income: 0, projected: 0 };
    });

    this.counterData
      .filter(transaction => {
        const transactionPeriod = transaction.period;
        return transactionPeriod >= this.periodFrom &&
          transactionPeriod <= this.periodTo;
      })
      .forEach(transaction => {
        if (transaction.period && monthlyData.hasOwnProperty(transaction.period)) {
          monthlyData[transaction.period].projected += Number(transaction.firstExpirationAmount || 0);
        }
      });

    this.counterData
      .filter(transaction => {
        const transactionPeriod = transaction.period;
        const platformValue = transaction.paymentPlatform?.toUpperCase() || 'EFECTIVO';
        
        const platformMapping: { [key: string]: string } = {
          'EFECTIVO': '1',
          'STRIPE': '2',
          'MERCADOPAGO': '3'
        };
        
        const meetsPaymentMethodFilter = 
          this.selectedPaymentMethods.length === 0 || 
          this.selectedPaymentMethods.includes(platformMapping[platformValue]);

        return transactionPeriod >= this.periodFrom &&
          transactionPeriod <= this.periodTo &&
          meetsPaymentMethodFilter &&
          transaction.status === 'PAGO';
      })
      .forEach(transaction => {
        if (transaction.period && monthlyData.hasOwnProperty(transaction.period)) {
          monthlyData[transaction.period].income += Number(transaction.amountPayed || 0);
        }
      });

    return monthlyData;
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

  private formatMonthYear(period: string): string {
    if (!period || !period.includes('-')) {
      return 'Invalid Date';
    }
    try {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);

      return new Intl.DateTimeFormat('es', {
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', period, error);
      return 'Invalid Date';
    }
  }

  private updateKPIs(monthlyData: { [key: string]: { income: number; projected: number } }) {
    let totalIncome = 0;
    let totalProjected = 0;
    let maxIncome = 0;
    let maxIncomeMonth = '';

    Object.entries(monthlyData).forEach(([month, data]) => {
      totalIncome += data.income;
      totalProjected += data.projected;

      if (data.income > maxIncome) {
        maxIncome = data.income;
        maxIncomeMonth = month;
      }
    });

    // Actualizar KPIs
    this.columnKpis[0].amount = totalProjected;
    this.columnKpis[3].amount = totalIncome;
    this.columnKpis[2].amount = maxIncome;
    this.columnKpis[2].subTitle = this.formatMonthYear(maxIncomeMonth);

    const deviation = totalProjected - totalIncome;
    const isPositiveDeviation = deviation > 0;

    this.columnKpis[1].amount = Math.abs(deviation);
    this.columnKpis[1].title = isPositiveDeviation ? 'Pendiente de Cobro' : 'Cobrado en Exceso';
    this.columnKpis[1].customStyles = {
      'background-color': isPositiveDeviation ? '#f49189' : '#b3f5bc',
      'color': '#000000'
    };
    this.columnKpis[1].subTitle = isPositiveDeviation ?
      'Monto facturado sin cobrar' :
      'Monto cobrado superior a lo facturado';
  }

  private updateChart(monthlyData: { [key: string]: { income: number; projected: number } }) {
    this.columnChartData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => [
        this.formatMonthYear(month),
        data.income,
        data.projected
      ]);

    this.columnChartData = [...this.columnChartData];
  }

  private updatePieChart() {
    const filteredData = this.counterData.filter(transaction => {
      const transactionPeriod = this.convertPeriodToYearMonth(transaction.period);
      const meetsApprovalFilter = this.transactionType === 'approved' ?
        transaction.approved :
        !transaction.approved;

      return transactionPeriod >= this.periodFrom &&
        transactionPeriod <= this.periodTo &&
        meetsApprovalFilter;
    });

    const platformCounts = filteredData.reduce((acc: { [key: string]: number }, curr) => {
      if (this.pieApprovalStatus === 'Aprobado' ? curr.amountPayed > 0 : true) {
        const platform = curr.paymentPlatform || 'EFECTIVO';
        acc[platform] = (acc[platform] || 0) + 1;
      }
      return acc;
    }, {});

    const totalTransactions = filteredData.length;
    const approvedTransactions = filteredData.filter(t => t.approved && t.amountPayed > 0).length;
    const rejectedTransactions = totalTransactions - approvedTransactions;

    this.pieKpis[0].amount = totalTransactions;
    this.pieKpis[1].amount = approvedTransactions;
    this.pieKpis[2].amount = rejectedTransactions;

    const platformTotal = Object.values(platformCounts).reduce((sum, count) => sum + count, 0);

    this.pieChartData = Object.entries(platformCounts)
      .map(([platform, count]) => {
        const percentage = (count / platformTotal) * 100;
        return [
          platform === 'MERCADOPAGO' ? 'Mp' :
            platform === 'EFECTIVO' ? 'Efectivo' : platform,
          Number(percentage.toFixed(2))
        ];
      })
      .sort((a, b) => {
        const order = { 'Mp': 0, 'STRIPE': 1, 'Efectivo': 2 };
        return (order[a[0] as keyof typeof order] || 0) - (order[b[0] as keyof typeof order] || 0);
      });
      debugger
      console.log(this.pieKpis)
  }

  updateTop5Debtors() {
    const top5Debtors = this.processTop5Debtors();
    this.updateDebtorKPIs(top5Debtors);
    this.top5Data = top5Debtors;
  }

  private updatePrincipalKpis() {
    const filteredData = this.counterData.filter(transaction => {
      const transactionPeriod = this.convertPeriodToYearMonth(transaction.period);
      return transactionPeriod >= this.periodFrom && transactionPeriod <= this.periodTo;
    });

    const totalIncome = filteredData
      .filter(t => t.status === 'PAGO')
      .reduce((sum, t) => sum + (t.amountPayed || 0), 0);

    const totalDebt = filteredData
      .filter(t => t.status === 'PENDIENTE')
      .reduce((sum, t) => sum + (t.firstExpirationAmount || 0), 0);

    const delinquentCount = new Set(
      filteredData
        .filter(t => t.status === 'PENDIENTE')
        .map(t => t.ownerId)
    ).size;

    const platformCounts = filteredData.reduce((acc, t) => {
      if (t.status === 'PAGO' && t.amountPayed > 0) {
        const platform = t.paymentPlatform || 'EFECTIVO';
        acc[platform] = (acc[platform] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topPlatformEntry = Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)[0] || ['N/A', 0];

    // Actualizar KPIs principales
    this.principalKpis[0].amount = totalIncome;
    this.principalKpis[1].amount = totalDebt;
    this.principalKpis[2].amount = delinquentCount;
    this.principalKpis[3].amount = topPlatformEntry[1];
    this.principalKpis[3].title = `Plataforma más utilizada: ${topPlatformEntry[0]}`;
  }

  private updateDebtorKPIs(debtors: DebtorInfo[]) {
    if (debtors.length > 0) {
      const avgOldestDays = debtors.reduce((sum, d) => sum + d.oldestDebtDays, 0) / debtors.length;
      
      const avgDebtDays = debtors.reduce((sum, d) => sum + d.averageDebtDays, 0) / debtors.length;
      
      const totalDebtTop5 = debtors.reduce((sum, d) => sum + d.totalDebt, 0);
  
      this.topFiveKpi[0].amount = Math.round(avgOldestDays);
      this.topFiveKpi[1].amount = Math.round(avgDebtDays);
      this.topFiveKpi[2].amount = totalDebtTop5;
    } else {
      this.topFiveKpi.forEach(kpi => kpi.amount = 0);
    }
  }

  private convertPeriodToYearMonth(period: any): string {
    if (!period) {
      console.warn('Period inválido:', period);
      return '';
    }

    try {
      if (typeof period === 'string' && /^\d{4}-\d{2}$/.test(period)) {
        return period;
      }

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
