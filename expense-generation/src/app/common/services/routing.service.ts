import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SideButton } from '../models/SideButton';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoutingService {
  private readonly router: Router = inject(Router);
  private redirectEvent = new Subject<string>();

  private readonly buttonsList: SideButton[] = [
    ///////////////////////////////////////////////////////////////////////////////
    //Notificaciones
    {
      icon: 'bi-bell',
      name: 'Notificaciones',
      roles: ['SuperAdmin', 'Gerente general'],
      childButtons: [
        {
          icon: 'bi-mailbox',
          name: 'Enviar',
          title: 'Envío de notificaciones',
          route: 'main/notifications/admin-post-notification',
          roles: ['SuperAdmin', 'Gerente general'],
        },
        {
          icon: 'bi-clipboard',
          name: 'Registro',
          title: 'Registro de notificaciones',
          route: 'main/notifications/admin-all-notifications',
          roles: ['SuperAdmin', 'Gerente general'],
        },
      ],
    },
    ///////////////////////////////////////////////////////////////////////////////
    //Botones de Users
    {
      //Btn principal
      icon: 'bi-house-heart',
      name: 'Familia',
      title: 'Grupo familiar',
      route: 'main/users/family',
      roles: ['SuperAdmin', 'Propietario', 'Inquilino'],
    },
    {
      //Btn con hijos
      icon: 'bi-houses',
      name: 'Consorcio',
      roles: ['SuperAdmin', 'Gerente general'],
      childButtons: [
        {
          icon: 'bi-person-lines-fill',
          name: 'Usuarios',
          title: 'Listado de usuarios',
          route: 'main/users/list',
          roles: ['SuperAdmin', 'Gerente general'],
        },
        {
          icon: 'bi-house-gear-fill',
          name: 'Lotes',
          title: 'Listado de lotes',
          route: 'main/plots/list',
          roles: ['SuperAdmin', 'Gerente general'],
        },
        {
          icon: 'bi-key-fill',
          name: 'Propietarios',
          title: 'Listado de propietarios',
          route: 'main/owners/list',
          roles: ['SuperAdmin', 'Gerente general'],
        },
      ],
    },
    ///////////////////////////////////////////////////////////////////////////////
    //Botones de multas
    {
      //Sanciones
      icon: 'bi-exclamation-triangle',
      name: 'Multas',
      roles: [
        'SuperAdmin',
        'Gerente general',
        'Gerente multas',
        'Propietario',
        'Inquilino',
      ],
      childButtons: [
        {
          //Denuncias
          icon: 'bi-envelope-plus-fill',
          name: 'Denunciar',
          title: 'Registrar Denuncia',
          route: 'main/complaints/post-complaint',
          roles: ['Propietario', 'Inquilino', 'Familiar mayor'],
        },
        {
          //botón listado denuncia
          icon: 'bi-envelope-paper-fill',
          name: 'Denuncias',
          title: 'Listado de Denuncias',
          route: 'main/complaints/list-complaint',
          roles: ['SuperAdmin', 'Gerente multas'],
        },
        {
          //Listado Informes
          icon: 'bi-clipboard2-fill',
          name: 'Informes',
          title: 'Listado de Informes',
          route: 'main/sanctions/report-list',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente multas'],
        },
        {
          //Listado multas y advertencias
          icon: 'bi-receipt',
          name: 'Multas/Advertencias',
          title: 'Listado de Multas y Advertencias',
          route: 'main/sanctions/sanctions-list',
          roles: ['SuperAdmin', 'Gerente multas', 'Propietario', 'Inquilino'],
        }
      ],
    },
    ///////////////////////////////////////////////////////////////////////////////
    //Botones de imputacion de gastos
    {
      //botón Listar Gastos para el Propietario
      icon: 'bi-currency-dollar',
      name: 'Mis Gastos',
      title: 'Mis Gastos',
      route: 'main/expenses/view-expense-owner',
      roles: ['SuperAdmin', 'Propietario'], //Inquilino?
    },
    {
      //Boton General para el Administrador (padre)
      icon: 'bi-person-gear',
      name: 'Gastos',
      title: 'Gestion de Gastos',
      roles: ['SuperAdmin', 'Gerente general', 'Gerente finanzas'],
      childButtons: [
        {
          //botón Listar Gastos para el Administrador
          icon: 'bi-receipt-cutoff',
          name: 'Listado',
          title: 'Listado de Gastos',
          route: 'main/expenses/view-expense-admin',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente finanzas'],
        },
        {
          //botón Lista Categoria de Gastos
          icon: 'bi-list-task',
          name: 'Categorias',
          title: 'Gestion Categoria gastos',
          route: 'main/expenses/view-category',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente finanzas'],
        },
        {
          //botón Registrar Gasto
          icon: 'bi-journal-arrow-up',
          name: 'Registrar',
          title: 'Registrar Gasto',
          route: 'main/expenses/register-expense',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente finanzas'],
        },
      ],
    },
    ///////////////////////////////////////////////////////////////////////////////
    //Botones de boletas
    {
      icon: 'bi-wallet',
      name: 'Boletas',
      title: 'Mis Boletas',
      route: 'main/invoices/expense-generation-user-view',
      roles: ['SuperAdmin', 'Propietario', 'Inquilino'],
    },
    {
      icon: 'bi-person-lines-fill',
      name: 'Boletas',
      title: 'Lista de Boletas',
      route: 'main/invoices/expense-generation-admin-view',
      roles: ['SuperAdmin', 'Gerente general', 'Gerente finanzas'],
    },
    // Esto no tendria que estar aca si se agrega el boton de dashboard
    // {
    //   icon: "bi-bar-chart-line",
    //   name: "Informes",
    //   title: "Informes Financieros",
    //   route: "main/expense-generation-accountant-view",
    //   roles: ["SuperAdmin", "Gerente general", "Contador"],
    // },
    ///////////////////////////////////////////////////////////////////////////////
    //Botones de inventario
    {
      icon: 'bi-boxes',
      name: 'Inventario',
      roles: ['SuperAdmin', 'Gerente general', 'Gerente inventario'],
      childButtons: [
        {
          icon: 'bi-inboxes-fill',
          name: 'Productos',
          title: 'Listado de Productos',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente inventario'],
          route: 'main/inventories/inventory',
        },
        {
          icon: 'bi-arrow-down-up',
          name: 'Historial',
          title: 'Historial de Stock',
          route: 'main/inventories/stock-movements-history',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente inventario'],
        },
        {
          icon: 'bi-arrow-left-right',
          name: 'Movimientos',
          title: 'Movimientos de Inventario',
          route: 'main/inventories/warehouse-movements',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente inventario'],
        },
        {
          icon: 'bi-truck',
          name: 'Proveedores',
          title: 'Listado de Proveedores',
          route: 'main/providers/suppliers',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente inventario'],
        },
        // Este boton no tiene ruta, el componente no existe actualmente
        {
          icon: 'bi-tags-fill',
          name: 'Categorias',
          title: 'Cateogorías de Productos',
          route: 'main/inventories/categories-list',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente inventario'],
        },
      ],
    },
    {
      icon: 'bi-person-vcard',
      name: 'Empleados',
      title: 'Lista de Empleados',
      roles: ['SuperAdmin', 'Gerente general', 'Gerente empleados'],
      childButtons: [
        {
          icon: 'bi-person-lines-fill',
          name: 'Listado',
          title: 'Listado de Empleados',
          route: 'main/employees/employees',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente empleados'],
        },
        {
          icon: 'bi-card-checklist',
          name: 'Desempeño',
          title: 'Historial de Desempeño',
          route: 'main/employees/performance',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente empleados'],
        },
        {
          icon: 'bi-person-badge-fill',
          name: 'Cargos',
          title: 'Cargos de Empleados',
          route: 'main/employees/charges',
          roles: ['SuperAdmin', 'Gerente general', 'Gerente empleados'],
        },
      ],
    },
    ///////////////////////////////////////////////////////////////////////////////
    //Botones de acceso
    {
      icon: 'bi-shield-fill-exclamation',
      name: 'Accesos',
      roles: [
        'SuperAdmin',
        'Gerente general',
        'Seguridad',
        'Propietario',
        'Inquilino',
      ],
      childButtons: [
        {
          icon: 'bi bi-person-lines-fill',
          name: 'Informe',
          title: 'Informe de Ingresos/Egresos',
          route: 'main/entries/reports',
          roles: ['SuperAdmin', 'Gerente general', 'Seguridad'],
        },
        {
          icon: 'bi bi-door-open-fill',
          name: 'Registro',
          title: 'Añadir Visitante',
          route: 'main/entries/visitor',
          roles: ['SuperAdmin', 'Gerente general', 'Propietario', 'Inquilino'],
        },
        {
          icon: 'bi bi-car-front-fill',
          name: 'Vehiculos',
          title: 'Registro de Vehículos',
          route: 'main/entries/vehicles',
          roles: ['SuperAdmin', 'Gerente general', 'Seguridad'],
        },
      ],
    },
  ];

  private titleSubject = new Subject<string>();
  private title: string = localStorage.getItem('title') || 'Página principal';

  constructor() {
    this.titleSubject.next(this.title);
  }

  getButtons() {
    return [...this.buttonsList];
  }

  //Redirige y setea el titulo(si es que viene)
  redirect(url: string, title?: string) {
    if (title) {
      this.setTitle(title);
    }
    this.router.navigate([url]);
    this.redirectEvent.next(this.getTitle());
  }

  getRedirectObservable(): Observable<string> {
    return this.redirectEvent.asObservable();
  }

  //Setear el titulo
  setTitle(title: string) {
    this.title = title;
    localStorage.setItem('title', title);
    this.titleSubject.next(title);
  }

  //Obtener el titulo
  getTitle(): string {
    return this.title;
  }

  getTitleObservable(): Observable<string> {
    return this.titleSubject.asObservable();
  }

  //Obtiene la ruta en forma de lista
  getRouteSegments(): string[] {
    const currentUrl = this.router.url;
    return currentUrl.split('/').filter((segment) => segment);
  }

  //Obtiene la ruta para cada dashboard
  getDashboardRoute() {
    const url: string[] = this.getRouteSegments();
    if (url.length > 1) {
      return `main/${url[1]}/dashboard`;
    }
    return '';
  }

  cleanStorage() {
    localStorage.removeItem('title');
    this.title = 'Página principal';
    this.titleSubject.next(this.title);
  }
}
