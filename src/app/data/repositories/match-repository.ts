import { inject, Injectable } from '@angular/core';
import { from, map } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { Match } from '../../core/models/match';

@Injectable({ providedIn: 'root' })
export class MatchRepository {
  private supabase = inject(SupabaseService);

  getAllMatches() {
    return from(
      this.supabase.matchesTable
        .select('*')
        .order('kickOffTime', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Match[];
      })
    );
  }

  getUpcomingMatches() {
    return from(
      this.supabase.matchesTable
        .select('*')
        .eq('status', 'upcoming')
        .order('kickOffTime', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Match[];
      })
    );
  }

  createMatch(match: Match) {
    return from(this.supabase.matchesTable.insert(match));
  }

  updateMatch(match: Match) {
    return from(this.supabase.matchesTable.update(match));
  }

  deleteMatch(id: string) {
    return from(this.supabase.matchesTable.delete().eq('id', id));
  }
}
