export enum MatchStatus {
  UPCOMING = 'à venir',
  LIVE = 'en direct',
  FINISHED = 'terminé',
  CANCELED = 'annulé'
}

export enum MatchStage {
  ROUND_OF_16 = '8ème de finale',
  QUARTER_FINAL = 'Quart de finale',
  SEMI_FINAL = 'Demi-finale',
  THIRDS_PLACE = 'Match pour la 3ème place',
  FINAL = 'Finale'
}

export interface Match {
  id?: string;
  created_at?: string;
  team_a: number;
  team_b: number;
  kickoff_time: string;
  status: MatchStatus;
  score_a: number;
  score_b: number;
  team_a_data?: any;
  team_b_data?: any;
  stage?: MatchStage;
}
