import { Match } from "./match";

export interface Prediction {
  id?: string;
  userId?: string;
  match_id: string;
  score_a: number;
  score_b: number;
  proof_url: string;
  timestamp?: Date;
  match?: Match;
  profile?: any

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
