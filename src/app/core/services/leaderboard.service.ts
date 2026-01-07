import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseService } from './supabase.service'; // Ajuste le chemin selon ton projet

// Interface basée sur ta vue SQL
export interface LeaderboardEntry {
  profile_id: string;
  name: string;
  total_points: number;
  predictions_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  // Injection du wrapper Supabase que tu as créé précédemment
  private supabase = inject(SupabaseService);

  /**
   * Récupère le classement complet depuis la vue SQL 'leaderboard'
   */
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return from(
      this.supabase.supabase
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Erreur lors de la récupération du classement:', error);
          throw error;
        }
        return (data as LeaderboardEntry[]) || [];
      })
    );
  }

  loadLeaderboard(type: 'amateur' | 'expert') {
  const table = type === 'expert' ? 'leaderboard_expert' : 'leaderboard_amateur';
  return from(
    this.supabase.supabase
      .from(table)
      .select('*')
      .order('total_points', { ascending: false })
  ).pipe(
    map(({ data, error }) => {
      if (error) {
        console.error('Erreur lors de la récupération du classement:', error);
        throw error;
      }
      return (data as LeaderboardEntry[]) || [];
    })
  );
}

  /**
   * Optionnel : Récupère uniquement le rang d'un utilisateur spécifique
   */
  getUserRank(userId: string): Observable<number> {
    return this.getLeaderboard().pipe(
      map(list => {
        const index = list.findIndex(item => item.profile_id === userId);
        return index !== -1 ? index + 1 : 0;
      })
    );
  }
}
