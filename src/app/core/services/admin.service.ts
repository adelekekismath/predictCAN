import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Prediction } from '../models/predictions';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor() { }

  supabase = inject(SupabaseService);

  getPendingPredictions(): Observable<Prediction[]> {
  return from(
    this.supabase.supabase
      .from('predictions')
      .select(`
        *,
        match:matches(*, team_a_data:can_2025_teams!team_a(team_name_fr), team_b_data:can_2025_teams!team_b(team_name_fr)),
        profile:profiles(name)
      `)
  ).pipe(
    map(({ data, error }) => {
      if (error) throw error;
      return data;
    })
  );
}

updatePredictionStatus(predictionId: string, status: 'validated' | 'rejected') {
  return from(
    this.supabase.supabase
      .from('predictions')
      .update({ status: status })
      .eq('id', predictionId)
  );
}
}
