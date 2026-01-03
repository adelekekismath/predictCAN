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

  /**
   * Enregistre ou modifie un pronostic (Règle 1 & 3)
   */
  submitPrediction(match: Match, newPrediction: Prediction): Observable<any> {
    // RÈGLE 1 : Vérification temporelle avant l'appel réseau
    if (!PredictionRules.canSubmitOrModify(match)) {
      return throwError(() => new Error("Le match a déjà commencé ou n'est plus éligible."));
    }

    const prediction = {
      match_id: match.id,
      user_id: this.authService.currentUserId,
      score_a: newPrediction.predictedTeamAScore,
      score_b: newPrediction.predictedTeamBScore,
      proof_url: newPrediction.proofUrl,
      updated_at: new Date()
    };

    // RÈGLE 3 : Validation de la preuve côté client
    // Note: On adapte ici l'objet pour correspondre à la méthode isProofValid
    if (!PredictionRules.isProofValid({ proofUrl: newPrediction.proofUrl, timestamp: prediction.updated_at } as any)) {
      return throwError(() => new Error("La preuve URL est obligatoire."));
    }

    return from(
      this.supabase.supabase
        .from('predictions')
        .upsert(prediction, { onConflict: 'user_id,match_id' })
    );
  }

  /**
   * Récupère le prono de l'utilisateur connecté pour un match
   */
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

  /**
   * Récupère toutes les prédictions d'un match (Règle 2)
   */
  getPredictionsForMatch(match: Match): Observable<any[]> {
    // RÈGLE 2 : On ne peut pas voir les pronos des autres avant le début
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
}
