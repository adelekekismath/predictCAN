

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, map, of } from 'rxjs';
import { Match } from '../models/match';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private readonly TABLE_NAME = 'matches';


getTeams(): Observable<any[]> {
  return from(
    this.supabase.supabase
      .from('can_2025_teams')
      .select('id, team_name_fr')
      .order('team_name_fr', { ascending: true })
  ).pipe(
    map(({ data, error }) => {
      if (error) throw error;
      return data || [];
    })
  );
}

getMatchesWithNames(): Observable<any[]> {
  return from(
    this.supabase.supabase
      .from('matches')
      .select(`
        *,
        team_a_data:can_2025_teams!team_a(team_name_fr),
        team_b_data:can_2025_teams!team_b(team_name_fr)
      `)
  ).pipe(
    map(({ data, error }) => {
      if (error) throw error;

      const matches = data as Match[];

      const statusPriority: Record<string, number> = {
        'en direct': 1,
        'à venir': 2,
        'terminé': 3,
        'annulé': 4
      };

      return matches.sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime();
      });
    })
  );
}

  updateMatchStatus(id: string, status: string): Observable<any> {
    return from(
      this.supabase.supabase
        .from('matches')
        .update({ status })
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      })
    );
  }

  savePrediction(matchId: string, scoreA: number, scoreB: number) {
  return from(
    this.supabase.supabase
      .from('predictions')
      .upsert({
        match_id: matchId,
        user_id: this.authService.currentUserId,
        score_a: scoreA,
        score_b: scoreB,
        updated_at: new Date()
      })
  );
}

  createMatch(match: Partial<Match>): Observable<void> {
    return from(
      this.supabase.supabase
        .from(this.TABLE_NAME)
        .insert(match)
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  updateMatch(id: string, updates: Partial<Match>): Observable<void> {
    return from(
      this.supabase.supabase
        .from(this.TABLE_NAME)
        .update(updates)
        .eq('id', id)
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  deleteMatch(id: string): Observable<void> {
    return from(
      this.supabase.supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id)
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }
}
