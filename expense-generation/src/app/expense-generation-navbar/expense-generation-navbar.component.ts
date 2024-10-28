import { Component, OnInit } from '@angular/core';
import { ExpenseGenerationUserSideButtonComponent } from "../expense-generation-user-side-button/expense-generation-user-side-button.component";
import { Router } from '@angular/router';
import { SideButton } from '../expense-generation-interfaces/expense-generation-sidebutton';

@Component({
  selector: 'app-expense-generation-navbar',
  standalone: true,
  imports: [ExpenseGenerationUserSideButtonComponent],
  templateUrl: './expense-generation-navbar.component.html',
  styleUrl: './expense-generation-navbar.component.css'
})
export class ExpenseGenerationNavbarComponent {

  //Expande el side
  expand: boolean = false;
  pageTitle: string = "Página Principal"

  constructor(private router: Router) { }
  // private readonly authService = inject(AuthService);

  // userRoles: string[] =  this.authService.getUser().roles!; 
  userRoles: string[] = ["Admin", "Owner"]

  //Traer con el authService
  actualRole : string = "Admin"
  //Lista de botones
  buttonsList: SideButton[] = [];

  // setName(){
  //   return this.authService.getUser().name + " " + this.authService.getUser().lastname;
  // }

  async ngOnInit(): Promise<void> {
    this.buttonsList = [
      // {
      //   icon: "bi-person",
      //   title: "Perfil",
      //   route: "home/profile",
      //   roles: ["SuperAdmin", "Admin", "Security", "Owner", "Spouse", "FamilyOld", "FamilyYoung", "Tenant"] //ver
      // },
      {
        icon: "bi-wallet",
        title: "Mis boletas",
        route: "expense-generation-user-view",
        roles: ["Admin"],
      },
      {
        icon: "bi-person-lines-fill",
        title: "Lista de boletas",
        route: "expense-generation-admin-view",
        roles: ["Admin"],
      
      },

      // { path: 'expense-generation-admin-view', component: ExpenseGenerationAdminViewComponent },
      // {path: 'expense-generation-user-view', component: ExpenseGenerationUserViewComponent},

    ];
  }

  //Expandir y contraer el sidebar
  changeState() {
    this.expand = !this.expand;
  }

  redirect(path: string) {
    // if(path === '/login'){
    //   this.authService.logOut();
    //   this.router.navigate([path]);
    // }
    // else{
    //   this.router.navigate([path]);
    // }
    this.router.navigate([path]);
  }

  setTitle(title: string) {
    this.pageTitle = title;
  }

  selectRole(role : string){
    this.actualRole = role;
  }
}
