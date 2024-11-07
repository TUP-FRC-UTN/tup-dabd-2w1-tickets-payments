import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, registerLocaleData } from '@angular/common';
import { ExpenseGenerationExpenseService } from '../expense-generation-services/expense-generation-expense.service';
import { ExpenseGenerationExpenseInterface } from '../expense-generation-interfaces/expense-generation-expense-interface';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Owner } from '../expense-generation-interfaces/owner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs/internal/Observable';
import { ExpenseGenerationNavbarComponent } from "../expense-generation-navbar/expense-generation-navbar.component";
import { BehaviorSubject } from 'rxjs';
import localeEsAr from '@angular/common/locales/es-AR';
registerLocaleData(localeEsAr, 'es-AR');

declare var window: any;

interface MultiplierData {
  latePayment: number;
  expiration: number;
  generationDay: number;
}



@Component({
  selector: 'app-expense-generation-admin-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpenseGenerationNavbarComponent],
  templateUrl: './expense-generation-admin-view.component.html',
  styleUrls: ['./expense-generation-admin-view.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ExpenseGenerationAdminViewComponent implements OnInit {
  selectedExpense: ExpenseGenerationExpenseInterface | null = null;
i: any;
  seeDetails(expense: ExpenseGenerationExpenseInterface) {
    this.selectedExpense = expense;
    this.updatedExpense = {
      id: expense.id,
      status: expense.status,
      first_expiration_date: expense.first_expiration_date,
      second_expiration_date: expense.second_expiration_date,
      second_expiration_amount: expense.second_expiration_amount,
    };
  }
  private expensesSubject = new BehaviorSubject<any[]>([]);
  expenses$ = this.expensesSubject.asObservable();
  visiblePages: number[] = [];
  pagedExpenses: any[] = [];
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
  latePaymentMultiplier: number = 0;
  expirationMultiplier: number = 0;
  isLoadingMultipliers: boolean = false;
  multiplierError: string | null = null;
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  observation: string = '';

  // Valores originales (desde la BD)
  originalLatePayment: number = 0;
  originalExpiration: number = 0;

  // Valores actuales en porcentaje
  latePaymentPercentage: number = 0;
  expirationPercentage: number = 0;

  // Valores originales
  originalGenerationDay: number = 1;

  // Valores actuales
  generationDay: number = 1;


  updatedExpense: any = {};
  detallesModal: any;
  observationModal: any;

  updateExpensesList(expenses: any[]) {
    this.expensesSubject.next(expenses);
  }

  

  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('multipliersModal') multipliersModal!: ElementRef;
  periodos = [
    { value: 1, label: '1 - Enero' },
    { value: 2, label: '2 - Febrero' },
    { value: 3, label: '3 - Marzo' },
    { value: 4, label: '4 - Abril' },
    { value: 5, label: '5 - Mayo' },
    { value: 6, label: '6 - Junio' },
    { value: 7, label: '7 - Julio' },
    { value: 8, label: '8 - Agosto' },
    { value: 9, label: '9 - Septiembre' },
    { value: 10, label: '10 - Octubre' },
    { value: 11, label: '11 - Noviembre' },
    { value: 12, label: '12 - Diciembre' }
  ];
  listStatus: string[] = [
    'Pendiente',
    'Pago',
    'Exceptuado'
  ];
  typedoc = ['DNI','PASAPORTE'];
  filter = {
    from: '',
    until: '',
    status: '',
    minimumAmount: null as number | null,
    period: null as number | null,
    typedoc: '',
    selectedPeriod: [] as number[],
  };
  multiplier: number = 1;


  status = ['Pendiente', 'Pago', 'Exceptuado'];
  showStatusDropdown = false;
  constructor(private expenseService: ExpenseGenerationExpenseService) { }

  originalLatePaymentPercentage: number = 0;
  originalExpirationPercentage: number = 0;

  // Control de campos
  fieldModified: 'generationDay' | 'latePayment' | 'expiration' | null = null;
  activeField: 'generationDay' | 'latePayment' | 'expiration' | null = null;

  onFieldFocus(fieldName: 'generationDay' | 'latePayment' | 'expiration'): void {
    if (!this.fieldModified || this.fieldModified === fieldName) {
      this.activeField = fieldName;
    }
  }



  showPeriodDropdown = false;
  periodFilter: string = '';

  filteredPeriodos() {
    return this.periodos.filter(periodo => 
        periodo.label.toLowerCase().includes(this.periodFilter.toLowerCase())
    );
}
toggleSelectedPeriod(month: number) {
  const index = this.filter.selectedPeriod.indexOf(month);
  if (index === -1) {
      this.filter.selectedPeriod.push(month);
  } else {
      this.filter.selectedPeriod.splice(index, 1);
  }
  this.filter$.next({ ...this.filter });
}

  toggleStatus(status: string) {
    const selectedStatus = this.filter.status ? this.filter.status.split(',') : [];
    const index = selectedStatus.indexOf(status);

    if (index === -1) {
        selectedStatus.push(status);
    } else {
        selectedStatus.splice(index, 1);
    }

    this.filter.status = selectedStatus.join(',');
    this.statusFilter = ''; 
    this.searchTickets();
  }
  isSelectedStatus(status: string): boolean {
    const selectedStatus = this.filter.status ? this.filter.status.split(',') : [];
    return selectedStatus.includes(status);
  }

  getSelectedStatusText(): string {
    if (this.statusFilter) {
        return this.statusFilter;
    }
    return this.filter.status ? this.filter.status : '';
  }

  statusFilter: string = ''; 


  filteredStatusList(): string[] {
    return this.listStatus.filter(status => 
        status.toLowerCase().includes(this.statusFilter.toLowerCase())
    );
  }


  onBlur() {
    setTimeout(() => {
      this.showStatusDropdown = false;
    }, 200);
  }
  loadOriginalValues(data: any) {
    this.originalGenerationDay = data.generationDay;
    this.originalLatePaymentPercentage = data.latePaymentPercentage;
    this.originalExpirationPercentage = data.expirationPercentage;

    // Establecer valores actuales
    this.generationDay = this.originalGenerationDay;
    this.latePaymentPercentage = this.originalLatePaymentPercentage;
    this.expirationPercentage = this.originalExpirationPercentage;
  }



  isFieldModified(fieldName: 'generationDay' | 'latePayment' | 'expiration'): boolean {
    switch (fieldName) {
      case 'generationDay':
        return this.generationDay !== this.originalGenerationDay;
      case 'latePayment':
        return this.latePaymentPercentage !== this.originalLatePaymentPercentage;
      case 'expiration':
        return this.expirationPercentage !== this.originalExpirationPercentage;
    }
  }



  onFieldBlur(): void {
    this.activeField = null;
  }

  onFieldChange(fieldName: 'generationDay' | 'latePayment' | 'expiration'): void {
    if (this.isFieldModified(fieldName)) {
      this.fieldModified = fieldName;
    } else {
      this.fieldModified = null;
    }
  }

  resetFieldState(): void {
    this.fieldModified = null;
    this.activeField = null;
  }
  resetAllValues(): void {
    this.generationDay = this.originalGenerationDay;
    this.latePaymentPercentage = this.originalLatePaymentPercentage;
    this.expirationPercentage = this.originalExpirationPercentage;
    this.resetFieldState();
  }

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

  onModalClose(): void {
    this.resetAllValues();
  }

  hasUnsavedChanges(): boolean {
    return this.isFieldModified('generationDay') ||
      this.isFieldModified('latePayment') ||
      this.isFieldModified('expiration');
  }

  ngOnInit() {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 3);
    this.filter$.next({ ...this.filter });
    this.filter$.subscribe(() => {
      this.searchTickets(); 
    });
    this.filter.until = today.toISOString().split('T')[0];
    this.filter.from = lastMonth.toISOString().split('T')[0];

    // Cargar datos iniciales
    this.loadInitialData();

    // Initialize modals
    this.detallesModal = new window.bootstrap.Modal(document.getElementById('detallesModal'));
    this.observationModal = new window.bootstrap.Modal(document.getElementById('observationModal'));
  }

  loadInitialData() {
    this.isLoading = true;
    this.error = null;

    // Primero cargar la configuración
    this.loadConfiguration();

    // Luego cargar los propietarios y sus boletas
    this.expenseService.getAllOwnersWithExpenses().subscribe({
      next: (data) => {
        this.ownersWithExpenses = data;

        // Crear el mapa de propietarios
        this.ownerMap = new Map(
          data.map(item => [item.owner.id, item.owner])
        );

        // Extraer todos los propietarios
        this.allOwners = data.map(item => item.owner);

        // Extraer todas las boletas y aplicar filtros iniciales
        const allExpenses = data.flatMap(item => item.expenses);

        // Verificar si hay boletas
        if (allExpenses.length === 0) {
          this.error = 'No se encontraron boletas en el sistema';
        } else {
          this.applyFiltersToExpenses(allExpenses);
        }

        // Cargar los nombres de los propietarios
        const uniqueOwnerIds = [...new Set(allExpenses.map(expense => expense.owner_id))];
        this.loadOwnerNames(uniqueOwnerIds);

        this.isLoading = false;

        // Actualizar la paginación
        this.loadExpenses();
      },
      error: (error) => {
        console.error('Error al cargar los datos:', error);
        this.error = 'Error al cargar los datos: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  maxDate: string = new Date().toISOString().split('T')[0];


  loadConfiguration() {
    this.isLoadingMultipliers = true;
    this.multiplierError = null;

    forkJoin({
      multipliers: this.expenseService.getMultipliers(),
      generationDay: this.expenseService.getGenerationDay()
    }).subscribe({
      next: (data) => {
        // Guardar valores originales
        this.originalLatePayment = data.multipliers.latePayment;
        this.originalExpiration = data.multipliers.expiration;
        this.originalGenerationDay = data.generationDay;

        // Establecer valores actuales en porcentaje
        this.latePaymentPercentage = this.originalLatePayment * 100;
        this.expirationPercentage = this.originalExpiration * 100;
        this.generationDay = data.generationDay;

        this.isLoadingMultipliers = false;
      },
      error: (error) => {
        console.error('Error loading configuration:', error);
        this.multiplierError = 'Error al cargar la configuración';
        this.isLoadingMultipliers = false;
      }
    });
  }

  loadExpenses() {
    this.totalItems = this.expenses.length;
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

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.calculateTotalPages();
    this.updateVisiblePages();
    this.updatePagedExpenses();
  }

  isValidGenerationDay(): boolean {
    return this.generationDay >= 1 && this.generationDay <= 28;
  }


  hasChangesExpense(): boolean {
    if (!this.selectedExpense) return false;

    return (
      this.updatedExpense.status !== this.selectedExpense.status ||
      this.updatedExpense.first_expiration_date !== this.selectedExpense.first_expiration_date ||
      this.updatedExpense.second_expiration_date !== this.selectedExpense.second_expiration_date ||
      this.updatedExpense.second_expiration_amount !== this.selectedExpense.second_expiration_amount
    );
  }

  getChangeSummaryExpenses(): string[] {
    const changes: string[] = [];
    if (!this.selectedExpense) return changes;

    if (this.updatedExpense.status !== this.selectedExpense.status) {
      changes.push(`Estado: ${this.selectedExpense.status} → ${this.updatedExpense.status}`);
    }
    if (this.updatedExpense.first_expiration_date !== this.selectedExpense.first_expiration_date) {
      changes.push('Cambio en la primera fecha de vencimiento');
    }
    if (this.updatedExpense.second_expiration_date !== this.selectedExpense.second_expiration_date) {
      changes.push('Cambio en la segunda fecha de vencimiento');
    }
    if (this.updatedExpense.second_expiration_amount !== this.selectedExpense.second_expiration_amount) {
      changes.push(`Monto 2do vencimiento: $${this.selectedExpense.second_expiration_amount} → $${this.updatedExpense.second_expiration_amount}`);
    }
    return changes;
  }

  ngAfterViewInit() {
    // Inicializar las referencias a los modales
    this.detallesModal = new window.bootstrap.Modal(document.getElementById('detallesModal'));
    this.observationModal = new window.bootstrap.Modal(document.getElementById('observationModalExpenses'));
  }

  openObservationModal() {
    const detallesModalElement = document.getElementById('detallesModal');
    const detallesModal = window.bootstrap.Modal.getInstance(detallesModalElement);
  
    if (detallesModal) {
      detallesModal.hide(); 
    }
    const observationModalElement = document.getElementById('observationModalExpenses');
    const observationModal = new window.bootstrap.Modal(observationModalElement, {
      backdrop: 'static', 
    });
    observationModal.show();
  }

  closeObservationModal() {
    const observationModalElement = document.getElementById('observationModalExpenses');
    const observationModal = window.bootstrap.Modal.getInstance(observationModalElement);
  
    if (observationModal) {
      observationModal.hide();
    }
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    const detallesModalElement = document.getElementById('detallesModal');
    const detallesModal = new window.bootstrap.Modal(detallesModalElement);
    detallesModal.show(); 
  }

  saveChangesExpenses() {
    if (!this.selectedExpense || !this.observation.trim()) return;

    const updateDTO = {
      id: this.updatedExpense.id,
      status: this.updatedExpense.status,
      expiration_multiplier: this.updatedExpense.second_expiration_amount,
      first_expiration_date: this.updatedExpense.first_expiration_date,
      second_expiration_date: this.updatedExpense.second_expiration_date
    };

    this.expenseService.updateExpense(updateDTO, this.observation).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Los cambios se guardaron correctamente'
        });
        this.observationModal.hide();
        this.detallesModal.hide();
        this.refreshExpensesList();
      },
      error: (error) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Los cambios se guardaron correctamente'
        });
        this.observationModal.hide();
        this.detallesModal.hide();
        this.refreshExpensesList();
      }
    });
  }

  refreshExpensesList() {
    this.loadInitialData();
  }

  activeOrder: string = '';
  directionOrder: 'asc' | 'desc' | '' = '';

  ordenarPor(campo: string) {
    if (this.activeOrder === campo) {
      if (this.directionOrder === 'asc') {
        this.directionOrder = 'desc';
      } else if (this.directionOrder === 'desc') {
        this.activeOrder = '';
        this.directionOrder = '';
      } else {
        this.directionOrder = 'asc';
      }
    } else {
      this.activeOrder = campo;
      this.directionOrder = 'asc';
    }

  }

  hasChanges(): boolean {
    const hasMultiplierChanges =
      this.latePaymentPercentage !== this.originalLatePayment * 100 ||
      this.expirationPercentage !== this.originalExpiration * 100;

    const hasGenerationDayChanges = this.generationDay !== this.originalGenerationDay;

    return hasMultiplierChanges || hasGenerationDayChanges;
  }

  getChangeSummary(): string[] {
    const changes: string[] = [];

    if (this.latePaymentPercentage !== this.originalLatePayment * 100) {
      changes.push(`Multiplicador de pagos atrasados: ${(this.originalLatePayment * 100).toFixed(1)}% → ${this.latePaymentPercentage.toFixed(1)}%`);
    }

    if (this.expirationPercentage !== this.originalExpiration * 100) {
      changes.push(`Multiplicador de vencimiento: ${(this.originalExpiration * 100).toFixed(1)}% → ${this.expirationPercentage.toFixed(1)}%`);
    }

    if (this.generationDay !== this.originalGenerationDay) {
      changes.push(`Día de generación: ${this.originalGenerationDay} → ${this.generationDay}`);
    }

    return changes;
  }
  selectedFilters: string[] = [];
  onEstadoChange(): void {
    this.selectedFilters = this.selectedFilters.filter(
      (status, index, self) => self.indexOf(status) === index
    );
    this.filter.status = this.selectedFilters.join(',');
    this.searchTickets();
  }

  handleSaveClick() {
    if (this.hasChanges()) {
      // Cerrar el modal de multiplicadores
      const multipliersModalElement = document.getElementById('multipliersModal');
      if (multipliersModalElement) {
        const multipliersModal = window.bootstrap.Modal.getInstance(multipliersModalElement);
        if (multipliersModal) {
          multipliersModal.hide();
        }
      }

      // Abrir el modal de observación
      const observationModalElement = document.getElementById('observationModal');
      if (observationModalElement) {
        const observationModal = new window.bootstrap.Modal(observationModalElement);
        observationModal.show();
      }
    }
  }

  saveChanges() {
    if (!this.observation.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'La observación es obligatoria',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const requests: Observable<any>[] = [];
    const updatedValues: any = {};

    // Preparar las solicitudes solo para los valores que han cambiado
    if (this.latePaymentPercentage !== this.originalLatePayment * 100 || this.expirationPercentage !== this.originalExpiration * 100 || this.generationDay !== this.originalGenerationDay) {
      updatedValues.latePayment = this.latePaymentPercentage / 100;
      requests.push(
        this.expenseService.updateLatePaymentMultiplier(
          this.latePaymentPercentage / 100,
          this.observation
        )
      );

    }

    if (this.expirationPercentage !== this.originalExpiration * 100) {
      updatedValues.expiration = this.expirationPercentage / 100;
      requests.push(
        this.expenseService.updateExpirationMultiplier(
          this.expirationPercentage / 100,
          this.observation
        )
      );
    }

    if (this.generationDay !== this.originalGenerationDay) {
      updatedValues.generationDay = this.generationDay;
      requests.push(
        this.expenseService.updateGenerationDay(
          this.generationDay,
          this.observation
        )
      );
    }

    if (requests.length === 0) {
      Swal.fire({
        title: 'Información',
        text: 'No hay cambios para guardar',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
      return;
    }



    // Mostrar loading
    Swal.fire({
      title: 'Guardando cambios',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Ejecutar todas las solicitudes en paralelo
    forkJoin(requests).subscribe({
      next: (responses) => {
        console.log('Respuestas:', responses);

        // Actualizar valores originales con los nuevos valores
        if (updatedValues.latePayment !== undefined) {
          this.originalLatePayment = updatedValues.latePayment;
        }
        if (updatedValues.expiration !== undefined) {
          this.originalExpiration = updatedValues.expiration;
        }
        if (updatedValues.generationDay !== undefined) {
          this.originalGenerationDay = updatedValues.generationDay;
        }

        // Cerrar modales
        this.closeAllModals();

        // Limpiar observación
        this.observation = '';

        // Mostrar mensaje de éxito
        Swal.fire({
          title: 'Éxito',
          text: 'Los cambios se han guardado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.updateVisiblePages;
          this.loadConfiguration();
        });
      },
      error: (error) => {
        console.error('Error al guardar los cambios:', error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al guardar los cambios',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }


  showConfirmation() {
    Swal.fire({
      title: 'Cambios guardados',
      text: 'Los cambios se han guardado correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: "#3085d6"
    }).then(() => {
      this.closeModal();
    });
  }

  closeModal() {
    this.observation = '';
    const modal = document.getElementById('multipliersModal');
    if (modal) {
      (modal as any).modal('hide'); // Cierra el modal
    }
  }

  updateMultiplierFromPercentage(field: 'latePayment' | 'expiration', value: number) {
    if (value < 0) value = 0;
    if (value > 100) value = 100;

    if (field === 'latePayment') {
      this.latePaymentPercentage = value;
    } else if (field === 'expiration') {
      this.expirationPercentage = value;
    }
  }


  closeAllModals() {
    ['multipliersModal', 'observationModal'].forEach(modalId => {
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      }
    });
  }

  openModal() {
    const modalElement = document.getElementById('multipliersModal');
    if (modalElement) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    }
  }


  validateDates() {
    const from = new Date(this.filter.from);
    const until = new Date(this.filter.until);
    const today = new Date();

    if (until < from) {
      this.filter.until = this.filter.from;
    }

    if (until > today) {
      this.filter.until = today.toISOString().split('T')[0];
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

  formattedPeriod: { value: string; label: string }[] = [];

  // Inicializa y formatea los períodos
  initializePeriodos() {
    // Obtener períodos únicos de las expenses
    const uniquePeriods = [...new Set(
      this.ownersWithExpenses
        .flatMap(owner => owner.expenses)
        .map(expense => expense.period)
    )].sort().reverse();

    // Formatear los períodos
    this.formattedPeriod = uniquePeriods.map(period => ({
      value: period,
      label: this.formatPeriod(period)
    }));
  }

  // Formatea el periodo de "2024-10" a "Octubre 2024"
  formatPeriod(period: string): string {
    const [year, month] = period.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  cleanFilters() {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 3);

    this.filter = {
      from: lastMonth.toISOString().split('T')[0],
      until: today.toISOString().split('T')[0],
      status: '',
      minimumAmount: null,
      period: null,
      typedoc: '',
      selectedPeriod: [],
    };
    this.searchTerm = '';
    this.selectedOwner = null;
    this.error = null;
    this.filteredUsers = [];
    this.loadAllOwnersWithExpenses();
  }



  getPlotNumbers(owner: Owner): string {
    if (!owner.plots || owner.plots.length === 0) return 'Sin lotes';
    const plotNumbers = owner.plots.map(plot => `${plot.plot_number}`).join(', ');
    return owner.plots.length > 1 ? `${plotNumbers}` : `${plotNumbers}`;
  }

  searchUsers() {
    if (!this.searchTerm) {
      this.pagedExpenses = [...this.expenses]; // Si no hay término de búsqueda, mostrar todo
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();

    this.pagedExpenses = this.expenses.filter(expense => {
      // Buscar en múltiples campos
      const ownerName = this.getOwnerName(expense.owner_id).toLowerCase();
      const ownerDni = this.getOwnerDni(expense.owner_id).toLowerCase();
      const ownerPlots = this.getOwnerPlots(expense.owner_id).toLowerCase();

      // Retornar true si el término de búsqueda está en cualquiera de los campos
      return ownerName.includes(searchTermLower) ||
        ownerDni.includes(searchTermLower) ||
        ownerPlots.includes(searchTermLower);
    });
  }

  selectUser(owner: Owner) {
    this.selectedOwner = owner;
    this.searchTerm = `${owner.name} ${owner.lastname}`;
    this.searchTickets();
  }

  filter$ = new BehaviorSubject(this.filter);

  searchTickets() {
    this.currentPage = 1;
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
      this.currentPage = 1;
      this.loadExpenses();
    }
  }

  private applyFiltersToExpenses(expenses: ExpenseGenerationExpenseInterface[]) {
    let filteredExpenses = expenses;

    const uniqueOwnerIds = [...new Set(filteredExpenses.map(expense => expense.owner_id))];
    this.loadOwnerNames(uniqueOwnerIds);
    if (this.filter.status) {
      const selectedStatus = this.filter.status.split(',');
      filteredExpenses = filteredExpenses.filter(expense =>
        selectedStatus.includes(expense.status)
      );
    }

    if (this.filter.from) {
      filteredExpenses = filteredExpenses.filter(expense =>
        new Date(expense.issueDate) >= new Date(this.filter.from)
      );
    }

    if (this.filter.until) {
      filteredExpenses = filteredExpenses.filter(expense =>
        new Date(expense.issueDate) <= new Date(this.filter.until)
      );
    }
    if (this.filter.selectedPeriod.length > 0) {
      filteredExpenses = filteredExpenses.filter(expense => {
        const expenseMonth = parseInt(expense.period.split('-')[1], 10);
        return this.filter.selectedPeriod.includes(expenseMonth);
      });
    }
    if (this.filter.minimumAmount) {
      filteredExpenses = filteredExpenses.filter(expense =>
        expense.actual_amount >= this.filter.minimumAmount!
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


  updateFilterField(field: keyof typeof this.filter, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    if (field === 'minimumAmount' || field === 'period') {
      (this.filter[field] as number | null) = value ? Number(value) : null;
    } else {
      (this.filter[field] as string) = value;
    }
    this.filter$.next({ ...this.filter });
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

  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
  }
  //Genera pdf y excel, filtros correctos, nuevo modal, boton ver mas implementado no completo, html rehecho y nueva interfaz, ligero



  selectedExpirationDates = {
    first_expiration_date: '',
    second_expiration_date: ''
  };

  validDates: boolean = true;

  validateExpirationDates() {
    const firstDate = new Date(this.updatedExpense.first_expiration_date);
    const secondDate = new Date(this.updatedExpense.second_expiration_date);

    if (firstDate >= secondDate) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La primera fecha de vencimiento debe ser anterior a la segunda fecha'
      });
      this.updatedExpense.second_expiration_date = this.selectedExpense?.second_expiration_date;
    }
  }

  calculateExpirationMultiplier() {
      const multiplier = this.updatedExpense.second_expiration_amount;
  }



  onlyAllowNumbers(event: KeyboardEvent): void {
    const key = event.key;
    if (!/[\d.]/.test(key) && key !== 'Backspace' && key !== 'Tab') {
      event.preventDefault();
    }

  }

  getOwnerName(ownerId: number): string {
    const owner = this.ownerMap.get(ownerId);
    return owner ? `${owner.name} ${owner.lastname}` : 'No asignado';
  }

  getOwnerDni(ownerId: number): string {
    const owner = this.ownerMap.get(ownerId);
    if (owner) {
        const initial = owner.dni_type === 'DNI' ? 'D' : owner.dni_type === 'Pasaporte' ? 'P' : 'N/A';
        return `${initial}- ${owner.dni}`;
    }
    return 'N/A';
}

  getOwnerDniType(ownerId: number): string {
    const owner = this.ownerMap.get(ownerId);
    return owner ? owner.dni_type : 'N/A';
  }
  getOwnerPlots(ownerId: number): string {
    const owner = this.ownerMap.get(ownerId);
    return owner ? this.getPlotNumbers(owner) : 'Sin lotes';
  }

  //EXPORTAR A PDF Y EXCEL

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageTitle = 'Listado de Boletas';
    doc.setFontSize(18);
    doc.text(pageTitle, 15, 10);
    doc.setFontSize(12);

    const formattedFrom = this.formatDate(new Date(this.filter.from));
    const formattedUntil = this.formatDate(new Date(this.filter.until));
    doc.text(`Fechas: Desde ${formattedFrom} hasta ${formattedUntil}`, 15, 20);

    const filteredData = this.expenses.map((expense: ExpenseGenerationExpenseInterface) => {
      return [
        expense.period,
        this.formatDate(new Date(expense.issueDate)),
        this.getOwnerName(expense.owner_id),
        expense.status,
        `$${(expense.actual_amount || 0).toFixed(2)}`,
        `$${(expense.amount_payed || 0).toFixed(2)}`
      ];
    });

    autoTable(doc, {
      head: [['Periodo', 'Fecha de Emisión', 'Nombre', 'Estado', 'Monto Actual', 'Monto Pagado']],
      body: filteredData,
      startY: 30,
      theme: 'grid',
      margin: { top: 30, bottom: 20 },
    });

    doc.save(`listado_boletas_${formattedFrom}_${formattedUntil}.pdf`);
  }

  // Exportar a Excel
  exportToExcel(): void {
    const encabezado = [
      ['Listado de Boletas'],
      [`Fechas: Desde ${this.formatDate(new Date(this.filter.from))} hasta ${this.formatDate(new Date(this.filter.until))}`],
      [],
      ['Periodo', 'Fecha de Emisión', 'Nombre', 'Estado', 'Monto Actual', 'Monto Pagado'] // Cambié 'ID Propietario' a 'Nombre'
    ];

    const excelData = this.expenses.map((expense: ExpenseGenerationExpenseInterface) => {
      return [
        expense.period,
        this.formatDate(new Date(expense.issueDate)),
        this.getOwnerName(expense.owner_id),
        expense.status,
        `$${(expense.actual_amount || 0).toFixed(2)}`, // Aseguramos dos decimales y mostramos $0.00 si es null o 0
        `$${(expense.amount_payed || 0).toFixed(2)}`   // Aseguramos dos decimales y mostramos $0.00 si es null o 0
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

    XLSX.writeFile(workbook, `listado_boletas_${this.formatDate(new Date(this.filter.from))}_${this.formatDate(new Date(this.filter.until))}.xlsx`);
  }




}