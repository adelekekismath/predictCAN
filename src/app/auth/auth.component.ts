import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone: true, // Recommandé pour les nouveaux composants
  imports: [CommonModule, ReactiveFormsModule], // Nettoyage ici
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'] // Ou gardez vos styles inline
})
export class AuthComponent implements OnInit {
  // --- Injections ---
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // --- État (Signals) ---
  // On crée un signal qui écoute l'URL en temps réel
  modeFromUrl = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('mode')))
  );

  activeTab = signal<'login' | 'register'>('login');
  isAdminMode = signal<boolean>(false);

  // --- Formulaire ---
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const mode = this.modeFromUrl();
    if (mode === 'login' || mode === 'register') {
      this.activeTab.set(mode);
    }
  }

  authWith(provider: 'google' ) {
    this.authService.signInWithProvider(provider).subscribe({
      next: () => console.log(`${this.activeTab()} réussi via ${provider}`),
      error: (err) => console.error(err)
    });
  }

  loginInAsAdmin() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.getRawValue();
    this.authService.loginAsAdminWithEmailAndPassword(email, password).subscribe({
      next: () => {
        console.log("Connexion Admin réussie");
        this.router.navigate(['/match']);
      },
      error: (error) => console.error("Erreur login admin:", error)
    });
  }
}
