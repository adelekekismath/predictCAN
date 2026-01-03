import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true, // Assurez-vous d'être en standalone si vous utilisez 'imports'
  imports: [CommonModule,RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  // Injection moderne
  private authService = inject(AuthService);
  private router = inject(Router);

  isMenuOpen = signal(false);


  isAuthenticated = toSignal(this.authService.isAuthenticated$(), { initialValue: false });

  toggleMenu() {
    this.isMenuOpen.update(val => !val);
  }

  login() {
    this.router.navigate(['auth'], { queryParams: { mode: 'login' } });
  }

  register() {
    this.router.navigate(['auth'], { queryParams: { mode: 'register' } });
  }

  logout() {
    this.authService.signOut().subscribe({
      next: () => {
        this.router.navigate(['auth'], { queryParams: { mode: 'login' } });
      }
    });
  }
  
}
