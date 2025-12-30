import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ɵInternalFormsSharedModule ,ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, ɵInternalFormsSharedModule,ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styles: [`
    :host {
      display: block;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-in {
      animation: fade-in 0.4s ease-out forwards;
    }
  `]
})
export class AuthComponent implements OnInit {
  activeTab = signal<'login' | 'register'>('login');
  isAdminMode = signal<boolean>(false);
  private fb = inject(FormBuilder);
  loginForm: FormGroup;

  constructor(private authService: AuthService, private route: ActivatedRoute, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    })
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe( paramMap => {
        this.activeTab.set(paramMap.get('mode') as 'login' | 'register');
    });
  }

  authWith(provider: 'google' |'facebook') {
    if(this.activeTab() === 'login') {
      this.loginWith(provider);
    } else {
      this.registerWith(provider);
    }
  }

  loginWith(provider: 'google' |'facebook') {
    this.authService.signInWithProvider(provider).subscribe(
      {
        next: () => {
          console.log("Connexion réussie");
        },
        error: (error) => {
          console.error(error);
        }
      }
    );
  }

  registerWith(provider: 'google' |'facebook') {
    this.authService.signInWithProvider(provider).subscribe(
      {
        next: () => {
          console.log("Inscription réussie");
        },
        error: (error) => {
          console.error(error);
        }
      }
    );
  }
  loginInAsAdmin() {
    this.authService.loginAsAdminWithEmailAndPassword(
      this.loginForm.value.email,
      this.loginForm.value.password
    ).subscribe(
      {
        next: () => {
          console.log("Connexion réussie");
          this.router.navigate(['match-manager']);
        },
        error: (error) => {
          console.error(error);
        }
      }
    );
  }

}
