import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ExpenseGenerationExpenseService } from '../expense-generation-services/expense-generation-expense.service';
import { ExpenseGenerationExpenseInterface } from '../expense-generation-interfaces/expense-generation-expense-interface';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Owner } from '../expense-generation-interfaces/owner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-expense-generation-admin-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-generation-admin-view.component.html',
  styleUrls: ['./expense-generation-admin-view.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ExpenseGenerationAdminViewComponent implements OnInit {
  selectedExpense: ExpenseGenerationExpenseInterface | null = null;
  async verDetalles(expense: ExpenseGenerationExpenseInterface) {
    this.selectedExpense = expense;
  }

  isLoading: boolean = false;
  error: string | null = null;
  expenses: ExpenseGenerationExpenseInterface[] = [];
  searchTerm: string = '';
  searchType: 'name' | 'dni' | 'plot' = 'name';
  filteredUsers: Owner[] = [];
  selectedOwner: Owner | null = null;
  allOwners: Owner[] = [];
  ownerMap: Map<number, Owner> = new Map();
  ownersWithExpenses: { owner: Owner; expenses: ExpenseGenerationExpenseInterface[] }[] = [];
  ownerNames: { [key: number]: string } = {};
  @ViewChild('searchInput') searchInput!: ElementRef;

  periodos = Array.from({length: 12}, (_, i) => i + 1);
  filtros = {
  desde: '',
  hasta: '',
  estado: '',
  montoMinimo: null as number | null,
  periodo: null as number | null  
  };

  estados = ['Pendiente', 'Pago', 'Exceptuado'];

  constructor(private expenseService: ExpenseGenerationExpenseService) {}

  loadOwnerNames(ownerIds: number[]) {
    const validOwnerIds = ownerIds.filter(id => id !== undefined && id !== null);
    
    validOwnerIds.forEach(id => {
      if (!this.ownerNames[id]) {
        this.expenseService.GetOwnerById(id).subscribe({
          next: (owner) => {
            if (owner) {
              this.ownerNames[id] = `${owner.name} ${owner.lastname}`;
            } else {
              this.ownerNames[id] = `Propietario ${id}`;
            }
          },
          error: (error) => {
            console.error(`Error loading owner name for ID ${id}:`, error);
            this.ownerNames[id] = `Propietario ${id}`;
          }
        });
      }
    });
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.filteredUsers = [];
    this.selectedOwner = null;
  }
  ngOnInit() {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 3);
  
    this.filtros.hasta = today.toISOString().split('T')[0];
    this.filtros.desde = lastMonth.toISOString().split('T')[0];
  
    this.loadAllOwnersWithExpenses();
  }

  maxDate: string = new Date().toISOString().split('T')[0];

validateDates() {
  const desde = new Date(this.filtros.desde);
  const hasta = new Date(this.filtros.hasta);
  const today = new Date();

  if (hasta < desde) {
    this.filtros.hasta = this.filtros.desde;
  }

  if (hasta > today) {
    this.filtros.hasta = today.toISOString().split('T')[0];
  }
}

  loadAllOwnersWithExpenses() {
    this.isLoading = true;
    this.error = null;

    this.expenseService.getAllOwnersWithExpenses().subscribe({
      next: (data) => {
        this.ownersWithExpenses = data;
        
        this.ownerMap = new Map(
          data.map(item => [item.owner.id, item.owner])
        );
        
        const allExpenses = data.flatMap(item => item.expenses);
        this.applyFiltersToExpenses(allExpenses);
        
        this.allOwners = data.map(item => item.owner);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los datos: ' + error.message;
        this.isLoading = false;
      }
    });
  }
  
  getOwnerDisplayName(ownerId: number | undefined): string {
    if (ownerId === undefined || ownerId === null) {
      return 'Propietario no asignado';
    }
    return this.ownerNames[ownerId] || `Cargando... (${ownerId})`;
  }

  limpiarFiltros() {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 3);
  
    this.filtros = {
      desde: lastMonth.toISOString().split('T')[0],
      hasta: today.toISOString().split('T')[0],
      estado: '',
      montoMinimo: null,
      periodo: null
    };
    this.searchTerm = '';
    this.selectedOwner = null;
    this.error = null;
    this.filteredUsers = [];
    this.loadAllOwnersWithExpenses();
  }

  

  getPlotNumbers(owner: Owner): string {
    if (!owner.plots || owner.plots.length === 0) return 'Sin lotes';
    return owner.plots.map(plot => `${plot.plotNumber}`).join(', ');
  }

  buscarUsuarios() {
    if (this.searchTerm.length < 2) {
      this.filteredUsers = [];
      return;
    }

    this.filteredUsers = this.allOwners.filter(owner => {
      if (this.searchType === 'name') {
        const fullName = `${owner.name} ${owner.lastname}`.toLowerCase();
        return fullName.includes(this.searchTerm.toLowerCase());
      } else if (this.searchType === 'dni') {
        return owner.dni.toString().includes(this.searchTerm);
      } else {
        return owner.plots?.some(plot => 
          plot.plotNumber.toString().includes(this.searchTerm)
        );
      }
    });
  }

  seleccionarUsuario(owner: Owner) {
    this.selectedOwner = owner;
    this.searchTerm = this.searchType === 'name' 
      ? `${owner.name} ${owner.lastname}`
      : owner.dni.toString();
    this.buscarBoletas();
  }

  buscarBoletas() {
    this.isLoading = true;
    this.error = null;

    if (this.selectedOwner) {
      const ownerData = this.ownersWithExpenses.find(item => item.owner.id === this.selectedOwner!.id);
      if (ownerData) {
        this.applyFiltersToExpenses(ownerData.expenses);
      } else {
        this.expenses = [];
      }
      this.isLoading = false;
    } else {
      const allExpenses = this.ownersWithExpenses.flatMap(item => item.expenses);
      this.applyFiltersToExpenses(allExpenses);
      this.isLoading = false;
    }
  }

  private applyFiltersToExpenses(expenses: ExpenseGenerationExpenseInterface[]) {
    let filteredExpenses = expenses;
    
    const uniqueOwnerIds = [...new Set(filteredExpenses.map(expense => expense.owner_id))];
    this.loadOwnerNames(uniqueOwnerIds);
    if (this.filtros.estado) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.status === this.filtros.estado
      );
    }

    if (this.filtros.desde) {
      filteredExpenses = filteredExpenses.filter(expense => 
        new Date(expense.issueDate) >= new Date(this.filtros.desde)
      );
    }

    if (this.filtros.hasta) {
      filteredExpenses = filteredExpenses.filter(expense => 
        new Date(expense.issueDate) <= new Date(this.filtros.hasta)
      );
    }
    if (this.filtros.periodo) {
      filteredExpenses = filteredExpenses.filter(expense => {
        const expenseMonth = parseInt(expense.period.split('-')[1], 10); 
        return expenseMonth === this.filtros.periodo; 
      });
    }
    if (this.filtros.montoMinimo) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.first_expiration_amount >= this.filtros.montoMinimo!
      );
    }

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

  async openPdf(id: number) {
    try {
      const response = await fetch(`http://localhost:8021/api/expenses/pdf/${id}`);
      if (!response.ok) {
        alert("No se pudo cargar el PDF");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      console.error('Error al abrir el PDF:', error);
      alert("Error al intentar abrir el PDF");
    }
  }

  async openReceipt(expense: ExpenseGenerationExpenseInterface) {
    try {
      if (!expense.payment_id) {
        alert("No hay comprobante disponible");
        return;
      }

      const hasLetters = /[a-zA-Z]/.test(expense.payment_id);
      const url = hasLetters 
        ? `http://localhost:8020/generate-receipt/${expense.payment_id}`
        : `http://localhost:8022/api/receipts/${expense.payment_id}/pdf`;

      const response = await fetch(url);
      if (!response.ok) {
        alert("No se pudo cargar el comprobante");
        return;
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl);
    } catch (error) {
      console.error('Error al abrir el comprobante:', error);
      alert("Error al intentar abrir el comprobante");
    }
  }


  //EXPORTAR A PDF Y EXCEL

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageTitle = 'Listado de Boletas';
    doc.setFontSize(18);
    doc.text(pageTitle, 15, 10);
    doc.setFontSize(12);

    const formattedDesde = this.formatDate(new Date(this.filtros.desde));
    const formattedHasta = this.formatDate(new Date(this.filtros.hasta));
    doc.text(`Fechas: Desde ${formattedDesde} hasta ${formattedHasta}`, 15, 20);

    const filteredData = this.expenses.map((expense: ExpenseGenerationExpenseInterface) => {
        return [
            expense.owner_id, 
            expense.period,
            this.formatDate(new Date(expense.issueDate)), 
            expense.status,
            `$${expense.actual_amount}`, 
            `$${expense.amount_payed}` 
        ];
    });

    autoTable(doc, {
        head: [['ID Propietario', 'Periodo', 'Fecha de Emisión', 'Estado', 'Monto Actual', 'Monto Pagado']],
        body: filteredData,
        startY: 30,
        theme: 'grid',
        margin: { top: 30, bottom: 20 },
    });

    doc.save('Boletas.pdf');
}

// Exportar a Excel
exportToExcel(): void {
    const encabezado = [
        ['Listado de Boletas'],
        [`Fechas: Desde ${this.formatDate(new Date(this.filtros.desde))} hasta ${this.formatDate(new Date(this.filtros.hasta))}`],
        [],
        ['ID Propietario', 'Periodo', 'Fecha de Emisión', 'Estado', 'Monto Actual', 'Monto Pagado']
    ];

    const excelData = this.expenses.map((expense: ExpenseGenerationExpenseInterface) => {
        return [
            expense.owner_id,
            expense.period,
            this.formatDate(new Date(expense.issueDate)), 
            expense.status,
            `$${expense.actual_amount}`,
            `$${expense.amount_payed}`
        ];
    });

    const worksheetData = [...encabezado, ...excelData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    worksheet['!cols'] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }  
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boletas');

    XLSX.writeFile(workbook, `listado_boletas_${this.formatDate(new Date(this.filtros.desde))}_${this.formatDate(new Date(this.filtros.hasta))}.xlsx`);
}

private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
}
 //Genera pdf y excel, filtros correctos, nuevo modal, boton ver mas implementado no completo, html rehecho y nueva interfaz, ligero
}