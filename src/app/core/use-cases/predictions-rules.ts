import { Match } from "../models/match";
import { Prediction, Result } from "../models/predictions";
import { Profile } from "../models/profile";

export class PredictionRules {

  static getPhaseCoefficient(stage: string): number {
    const coefficients: { [key: string]: number } = {
      '8ème de finale': 1.5,
      'Quart de finale': 2,
      'Demi-finale': 2.5,
      'Match pour la 3ème place': 3,
      'finale': 3
    };
    return coefficients[stage.toLowerCase()] || 1;
  }

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
    return now.getTime() >= new Date(match.kickoff_time).getTime();
  }

  /**
   * REGLE 3 : Validation de la preuve (Traçabilité).
   * Vérifie si la prédiction contient bien une URL de preuve et si l'horodatage
   * de la prédiction est cohérent.
   */
  static isProofValid(prediction: Prediction): boolean {
    const hasProof = !!prediction.proof_url && prediction.proof_url.length > 0;

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
  static calculatePointsEarned(prediction: Prediction, match: Match): number {
    const Ci = this.getPhaseCoefficient(match.stage!);

    // 1. Indicateurs de base
    const isResult = (prediction.score_a > prediction.score_b && match.score_a > match.score_b) ||
                     (prediction.score_a < prediction.score_b && match.score_a < match.score_b) ||
                     (prediction.score_a === prediction.score_b && match.score_a === match.score_b) ? 1 : 0;

    const isDiff = (prediction.score_a - prediction.score_b) === (match.score_a - match.score_b) ? 1 : 0;

    const isExact = (prediction.score_a === match.score_a && prediction.score_b === match.score_b) ? 1 : 0;

    const basePoints = isResult + isDiff + (2 * isExact);

    // 2. Bonus d'incertitude (basé sur les ranks de tes images)
    // Formule : 1 + 0.5 * (1 - |RankA - RankB| / 100)
    const rankDiff = Math.abs(match.team_a_data.id - match.team_b_data.id);
    const uncertaintyBonus = 1 + 0.5 * (1 - (rankDiff / 100));

    // 3. Calcul final
    const finalScore = Ci * basePoints * uncertaintyBonus;

    // On arrondit à 2 décimales pour l'affichage
    return Math.round(finalScore * 100) / 100;
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
