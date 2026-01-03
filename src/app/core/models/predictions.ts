export interface Prediction {
  id?: string;
  userId?: string;
  matchId: string;
  predictedTeamAScore: number;
  predictedTeamBScore: number;
  proofUrl: string;
  timestamp?: Date;
}

export interface Result {
  id: string;
  matchId: string;
  actualTeamAScore: number;
  actualTeamBScore: number;
  determinedAt: Date;
}

export interface Leaderboard {
  id: string;
  userId: string;
  totalPoints: number;
  rank: number;
  lastUpdated: Date;
}
