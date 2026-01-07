import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, map, tap, distinctUntilChanged, switchMap, of, from, catchError, shareReplay } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/profile';



@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);

  readonly currentUser$ = this.currentUserSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  constructor() {
    this.initializeAuth();
  }


  private initializeAuth(): void {
    this.supabase.session$.subscribe(session => {
      this.updateUser(session?.user ?? null);
    });

    this.supabase.authChanges$.subscribe(({ event, session }) => {
      this.updateUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/auth'], { queryParams: { mode: 'login' } });
      }
    });
  }


  readonly isAdmin$: Observable<boolean> = this.currentUser$.pipe(
    switchMap(user => {
      if (!user) return of(false);

      return from(
        this.supabase.getTable('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
      ).pipe(
        map(response => {
          return response.data?.role === 'admin';
        }),
        catchError(() => of(false))
      );
    }),
    shareReplay(1)
  );

  private updateUser(user: User | null): void {
    this.currentUserSubject.next(user);
  }


  signInWithProvider(provider: 'google' ): Observable<void> {
    return this.supabase.loginWithProvider(provider);
  }

  loginAsAdminWithEmailAndPassword(email: string, password: string): Observable<void> {
    return this.supabase.loginAsAdmin(email, password);
  }


  signOut(): Observable<void> {
    return this.supabase.logout().pipe(
      tap(() => this.updateUser(null))
    );
  }

  isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }


  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }


  get currentUserId(): string | undefined {
    return this.currentUserSubject.value?.id;
  }

  get currentUserProfile$(): Observable<Profile | null> {
    return from(
      this.supabase.getTable('profiles')
        .select('*')
        .eq('id', this.currentUserId)
        .single()
    ).pipe(
      map(response => response.data || null)
    );
  }
}
