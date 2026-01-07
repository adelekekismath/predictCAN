import { Component, signal, OnInit, inject } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { DecimalPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-leaderboard',
  imports: [DecimalPipe, CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent implements OnInit {
  private supabase = inject(SupabaseService);

  // État du classement
  mode = signal<'amateur' | 'expert'>('expert');
  ranking = signal<any[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    this.fetchData();
  }

  setMode(newMode: 'amateur' | 'expert') {
    this.mode.set(newMode);
    this.fetchData();
  }

  async fetchData() {
    this.isLoading.set(true);

    // On sélectionne la vue correspondante selon le mode
    const viewName = this.mode() === 'expert' ? 'leaderboard_expert' : 'leaderboard_amateur';

    const { data, error } = await this.supabase.supabase
      .from(viewName)
      .select('*')
      .order('total_points', { ascending: false });

    if (!error && data) {
      this.ranking.set(data);
    }

    this.isLoading.set(false);
  }
}
