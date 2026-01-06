import { Component, inject, OnInit, signal } from '@angular/core';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import {DecimalPipe} from "@angular/common";

@Component({
  selector: 'app-leaderboard',
  imports: [DecimalPipe],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})

export class LeaderboardComponent implements OnInit {
  private leaderboardService = inject(LeaderboardService);

  // Signal pour stocker les données du classement
  ranking = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.leaderboardService.getLeaderboard().subscribe({
      next: (data) => {
        this.ranking.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
