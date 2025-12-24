export enum MatchStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  FINISHED = 'finished',
  CANCELED = 'canceled'
}

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  kickOffTime: Date;
  scoreA: string;
  scoreB: string;
  venue: string;
  status: MatchStatus;
  createdAt?: Date;
}
