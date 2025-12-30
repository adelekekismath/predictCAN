

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, map } from 'rxjs';
import { Match } from '../models/match';

@Injectable({ providedIn: 'root' })
export class MatchService {
  private supabase = inject(SupabaseService);
  private readonly TABLE_NAME = 'matches';


  getMatches(): Observable<Match[]> {
    return from(
      this.supabase.supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('kickoff_time', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Match[];
      })
    );
  }

  // Récupérer toutes les équipes pour le formulaire
getTeams(): Observable<any[]> {
  return from(
    this.supabase.supabase
      .from('can_2025_teams') // Remplacez par le nom réel de votre table d'équipes
      .select('id, team_name_fr')
      .order('team_name_fr', { ascending: true })
  ).pipe(
    map(({ data, error }) => {
      if (error) throw error;
      return data || [];
    })
  );
}

// Version améliorée de getMatches pour voir les noms au lieu des IDs
getMatchesWithNames(): Observable<any[]> {
  return from(
    this.supabase.supabase
      .from('matches')
      .select(`
        *,
        team_a_data:can_2025_teams!team_a(team_name_fr),
        team_b_data:can_2025_teams!team_b(team_name_fr)
      `)
  ).pipe(map(({ data }) => data || []));
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
