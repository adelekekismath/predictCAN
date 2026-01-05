import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { from, Observable, map, switchMap, throwError, of, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  supabase: SupabaseClient = createClient(
    environment.SUPABASE_URL,
    environment.SUPABASE_ANON_KEY
  );


  get session$(): Observable<Session | null> {
    return from(this.supabase.auth.getSession()).pipe(
      map(response => response.data.session),
      shareReplay(1)
    );
  }

  getCurrentUser$(): Observable<any | null> {
    return this.session$.pipe(
      map(session => session?.user ?? null)
    );
  }

  get authChanges$(): Observable<{ event: AuthChangeEvent; session: Session | null }> {
    return new Observable((observer) => {
      const { data } = this.supabase.auth.onAuthStateChange((event, session) => {
        observer.next({ event, session });
      });
      return () => data.subscription.unsubscribe();
    });
  }

  getTable(tableName: string) {
    return this.supabase.from(tableName);
  }

  uploadProof(file: File, userId: string): Observable<string> {
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    return from(this.supabase.storage.from('proofs').upload(fileName, file)).pipe(
      switchMap(({ data, error }) => {
        if (error) return throwError(() => error);

        const { data: publicUrl } = this.supabase.storage
          .from('proofs')
          .getPublicUrl(fileName);
        console.log('Public URL:', publicUrl);
        return of(publicUrl.publicUrl);
      })
    );
  }

  loginWithProvider(provider: 'google'): Observable<void> {
    return from(
      this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : undefined,
        },
      })
    ).pipe(map(() => void 0));
  }

  loginAsAdmin(email: string, password: string): Observable<void> {
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      map(() => void 0)
    );
  }

  logout(): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(map(() => void 0));
  }

  isAuthenticated$(): Observable<boolean> {
    return this.session$.pipe(map(session => !!session));
  }
}
