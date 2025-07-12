import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { UserService } from '../../../features/user/user.service';
import { User } from '../../../features/user/models/user';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  sidebarVisible = false;
  user!: User
  search: string = '';

  constructor(
    readonly authService: AuthService,
    readonly userService: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    const userData = this.authService.getUser();
    if (userData && userData.id) {
      this.userService.getUser(userData.id).subscribe({
        next: (data: User) => {
          this.user = data;
        },
        error: (err) => {
          console.error('Error al obtener los datos del usuario:', err);
        }
      });
    }
  }

  get profileImageUrl(): string {
    return this.user.profile_picture;
  }

  get userFullName(): string {
    return `${this.user.name} ${this.user.lastname}`;
  }

  get userRole(): string {
    // Puedes traducir el rol si lo deseas
    switch (this.user.role) {
      case 'admin': return 'Administrador';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Paciente';
      default: return 'Usuario';
    }
  }

  goSearch() {
    // Implementa la lógica de búsqueda si tienes una página de resultados
    // Por ejemplo: this.router.navigate(['/search'], { queryParams: { q: this.search } });
  }

  @Output() searchEvent = new EventEmitter<string>();

  editProfile() {
    this.router.navigate(['/profile']);
    this.menuOpen = false;
    this.sidebarVisible = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.menuOpen = false;
    this.sidebarVisible = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}


