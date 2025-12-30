import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatchService } from '../../core/services/match.service';
import { Match } from '../../core/models/match';
import { AuthService } from '../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-match-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './match-management.component.html',
  styleUrls: ['./match-management.component.css']
})
export class MatchManagementComponent implements OnInit {
  private matchService = inject(MatchService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Signaux et Observables
  matches = signal<Match[]>([]);
  isAdmin = toSignal(this.authService.isAdmin$, { initialValue: false });
  loading = signal(false);
  teams = signal<any[]>([]);

  // Formulaire pour ajouter/modifier
  matchForm = this.fb.group({
    team_a: [null, [Validators.required]],
    team_b: [null, [Validators.required]],
    kickoff_time: ['', [Validators.required]],
    stage: ['8ème de finale', [Validators.required]],
    status: ['upcoming'],
    score_a: [0],
    score_b: [0]
  });

  stages = [
  '8ème de finale',
  'Quart de finale',
  'Demi-finale',
  'Match pour la 3ème place',
  'Finale'
];

  ngOnInit() {
    this.loadMatches();
  }

  loadMatches() {
    this.loading.set(true);
    this.matchService.getTeams().subscribe(data =>{
      console.log(data);
      this.teams.set(data);
    } );
    this.matchService.getMatchesWithNames().subscribe({
      next: (data) => {
        this.matches.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSubmit() {
    if (this.matchForm.valid && this.isAdmin()) {
      const newMatch = this.matchForm.value as Partial<Match>;
      this.matchService.createMatch(newMatch).subscribe(() => {
        this.matchForm.reset({ score_a: 0, score_b: 0, status: 'upcoming' });
        this.loadMatches();
      });
    }
  }

  deleteMatch(id: string | undefined) {
    if (id && confirm('Supprimer ce match ?') && this.isAdmin()) {
      this.matchService.deleteMatch(id).subscribe(() => this.loadMatches());
    }
  }

  updateScore(id: string | undefined, side: 'a' | 'b', change: number) {
    const match = this.matches().find(m => m.id === id);
    if (!match || !id || !this.isAdmin()) return;

    const updates = {
      score_a: side === 'a' ? Math.max(0, (match.score_a || 0) + change) : match.score_a,
      score_b: side === 'b' ? Math.max(0, (match.score_b || 0) + change) : match.score_b
    };

    this.matchService.updateMatch(id, updates).subscribe(() => this.loadMatches());
  }
}
