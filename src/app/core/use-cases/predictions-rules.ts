import { Match } from "../models/match";
import { Prediction, Result, Leaderboard } from "../models/predictions";
import { Profile } from "../models/profile";

export class PredictionRules {

  /**
   * REGLE 1 : Verrouillage temporel strict.
   * Une prédiction (création ou modification) est autorisée UNIQUEMENT :
   * - Si le match a le statut 'UPCOMING'
   * - ET si l'heure actuelle est avant le coup d'envoi.
   */
  static canSubmitOrModify(match: Match): boolean {
    const now = new Date();
    const isUpcoming = match.status === 'à venir';
    const isBeforeKickoff = now.getTime() < new Date(match.kickoff_time).getTime();

    return isUpcoming && isBeforeKickoff;
  }

  /**
   * REGLE 2 : Consultation des prédictions des autres.
   * Un utilisateur peut voir les scores prédits par les autres UNIQUEMENT :
   * - Une fois que le match a commencé (pour éviter la triche).
   */
  static canViewOthersPredictions(match: Match): boolean {
    const now = new Date();
    return now.getTime() >= new Date(match.kickOffTime).getTime();
  }

  /**
   * REGLE 3 : Validation de la preuve (Traçabilité).
   * Vérifie si la prédiction contient bien une URL de preuve et si l'horodatage
   * de la prédiction est cohérent.
   */
  static isProofValid(prediction: Prediction): boolean {
    const hasProof = !!prediction.proofUrl && prediction.proofUrl.length > 0;

    const hasTimestamp = !!prediction.timestamp;

    return hasProof && hasTimestamp;
  }

  /**
   * REGLE 4 : Calcul automatique du résultat (Points).
   * Système de points basé sur le schéma "Results" :
   * - 5 points : Score exact (ex: 2-1 prédit, 2-1 réel).
   * - 2 points : Bon vainqueur ou nul, mais score erroné (ex: 1-0 prédit, 2-1 réel).
   * - 0 point : Mauvais pronostic.
   */
  static calculatePointsEarned(prediction: Prediction, result: Result): number {
    const isExactScore =
      prediction.predictedTeamAScore === result.actualTeamAScore &&
      prediction.predictedTeamBScore === result.actualTeamBScore;

    if (isExactScore) return 5;
    const getWinner = (teamA: number, teamB: number) => {
      if (teamA > teamB) return 'H';
      if (teamB > teamA) return 'A';
      return 'D';
    };

    const predictedWinner = getWinner(prediction.predictedTeamAScore, prediction.predictedTeamBScore);
    const actualWinner = getWinner(result.actualTeamAScore, result.actualTeamBScore);

    return predictedWinner === actualWinner ? 2 : 0;
  }

  /**
   * REGLE 5 : Éligibilité au classement.
   * Un utilisateur est éligible au classement s'il a au moins une prédiction
   * validée par l'administrateur avec une preuve conforme.
   */
  static isEligibleForLeaderboard(user: Profile, userPredictions: Prediction[]): boolean {
    return userPredictions.some(p => this.isProofValid(p));
  }
}
