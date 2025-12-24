import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { map } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);

  currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  constructor() {
    this.supabase.auth.getUser().then(({ data }) => {
      this.currentUserSubject.next(data.user);
    });

    this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      this.currentUserSubject.next(user);

      if (event === 'SIGNED_IN') {
        this.router.navigate(['/dashboard']);
      }

      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Connexion via OAuth
   */
  signInWithProvider(
    provider: 'google' | 'apple' | 'facebook'
  ): Observable<void> {
    return from(
      this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard',
          queryParams:
            provider === 'google'
              ? {
                  access_type: 'offline',
                  prompt: 'select_account',
                }
              : undefined,
        },
      })
    ).pipe(
      map(() => void 0)
    );
  }


  signOut(): Observable<void> {
    return from(
      this.supabase.auth.signOut()
    ).pipe(
      map(() => void 0)
    );
  }

  isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}
