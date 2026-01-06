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
        match:matches(*),
        profile:profiles(name)
      `)
  ).pipe(
    map(({ data, error }) => {
      console.log(data);
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
