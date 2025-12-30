import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, map, tap, distinctUntilChanged, switchMap, of, from, catchError, shareReplay } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // BehaviorSubject pour garder l'état de l'utilisateur en mémoire
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  // Observable exposé, avec distinctUntilChanged pour éviter les notifications inutiles
  readonly currentUser$ = this.currentUserSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialise l'écoute de l'état d'authentification
   */
  private initializeAuth(): void {
    // 1. Récupérer la session initiale
    this.supabase.session$.subscribe(session => {
      this.updateUser(session?.user ?? null);
    });

    // 2. Écouter les changements futurs (Login, Logout, Refresh)
    this.supabase.authChanges$.subscribe(({ event, session }) => {
      this.updateUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/auth'], { queryParams: { mode: 'login' } });
      }
    });
  }

  // Dans auth.service.ts

  readonly isAdmin$: Observable<boolean> = this.currentUser$.pipe(
    switchMap(user => {
      // Si pas d'utilisateur, il n'est pas admin
      if (!user) return of(false);

      // Requête vers la table 'profiles' via le SupabaseService
      return from(
        this.supabase.getTable('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
      ).pipe(
        map(response => {
          // On vérifie si le rôle est 'admin'
          // Note: 'data' contient l'objet retourné par .single()
          return response.data?.role === 'admin';
        }),
        // En cas d'erreur (ex: profil non trouvé), on renvoie false
        catchError(() => of(false))
      );
    }),
    // shareReplay évite de refaire la requête HTTP si plusieurs composants s'abonnent
    shareReplay(1)
  );

  private updateUser(user: User | null): void {
    this.currentUserSubject.next(user);
  }

  /**
   * Connexion via OAuth
   * Note : On ne ré-enveloppe pas dans from() car SupabaseService renvoie déjà un Observable
   */
  signInWithProvider(provider: 'google' | 'facebook'): Observable<void> {
    return this.supabase.loginWithProvider(provider);
  }

  /**
   * Connexion classique Admin
   */
  loginAsAdminWithEmailAndPassword(email: string, password: string): Observable<void> {
    return this.supabase.loginAsAdmin(email, password);
  }

  /**
   * Déconnexion
   */
  signOut(): Observable<void> {
    return this.supabase.logout().pipe(
      tap(() => this.updateUser(null))
    );
  }

  /**
   * Vérification réactive (Observable)
   */
  isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }

  /**
   * Vérification instantanée (Snapshot)
   */
  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Récupérer l'ID de l'utilisateur courant
   */
  get currentUserId(): string | undefined {
    return this.currentUserSubject.value?.id;
  }
}
