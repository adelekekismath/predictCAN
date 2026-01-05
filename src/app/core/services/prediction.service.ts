import { Injectable, inject } from '@angular/core';
import { PredictionRules } from '../use-cases/predictions-rules';
import { Match } from '../models/match';
import { from, Observable, map, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { Prediction } from '../models/predictions';

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);


  submitPrediction(match: Match, newPrediction: Prediction): Observable<any> {
    if (!PredictionRules.canSubmitOrModify(match)) {
      return throwError(() => new Error("Le match a déjà commencé ou n'est plus éligible."));
    }

    const prediction = {
      match_id: match.id,
      user_id: this.authService.currentUserId,
      score_a: newPrediction.score_a,
      score_b: newPrediction.score_b,
      proof_url: newPrediction.proofUrl,
      updated_at: new Date()
    };

    if (!PredictionRules.isProofValid({ proofUrl: newPrediction.proofUrl, timestamp: prediction.updated_at } as any)) {
      return throwError(() => new Error("La preuve URL est obligatoire."));
    }

    return from(
      this.supabase.supabase
        .from('predictions')
        .upsert(prediction, { onConflict: 'user_id,match_id' })
    );
  }

  getCurrentUserPredictions(): Observable<any[]> {
    const userId = this.authService.currentUserId;
    return from(
      this.supabase.supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)
    ).pipe(map(res => res.data || []));
  }


  getUserPrediction(matchId: number): Observable<any> {
    const userId = this.authService.currentUserId;
    return from(
      this.supabase.supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .single()
    ).pipe(map(res => res.data));
  }


  getPredictionsForMatch(match: Match): Observable<any[]> {
    if (!PredictionRules.canViewOthersPredictions(match)) {
      return throwError(() => new Error("Les pronostics des autres seront visibles après le coup d'envoi."));
    }

    return from(
      this.supabase.supabase
        .from('predictions')
        .select('*, profiles(username)')
        .eq('match_id', match.id)
    ).pipe(map(res => res.data || []));
  }

  getPredictionByMatchAndUser(matchId: string, userId: string): Observable<any> {
    return from(
      this.supabase.supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .single()
    ).pipe(map(res => res.data));
  }

  getAllUserPredictionsByMatch(matchId: string): Observable<any[]> {
    return from(
      this.supabase.supabase
        .from('predictions')
        .select('*, profiles(username)')
        .eq('match_id', matchId)
    ).pipe(map(res => res.data || []));
  }
}
