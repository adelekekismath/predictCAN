
import { inject, Injectable } from '@angular/core';
import { from, map } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { Prediction } from '../../core/models/predictions';

@Injectable({ providedIn: 'root' })
export class PredictionRepository {
  private supabase = inject(SupabaseService);

  submitPrediction(prediction: Prediction) {
    return from(this.supabase.predictionsTable.insert(prediction));
  }

  updatePrediction(prediction: Prediction) {
    return from(this.supabase.predictionsTable.update(prediction));
  }

  deletePrediction(id: string) {
    return from(this.supabase.predictionsTable.delete().eq('id', id));
  }

  getPredictionsByMatchId(matchId: string) {
    return from(this.supabase.predictionsTable.select('*').eq('match_id', matchId))
  }
}
