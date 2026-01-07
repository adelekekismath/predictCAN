import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../app/features/home/home.component').then(
        (m) => m.HomeComponent
      ),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('../app/auth/auth.component').then((m) => m.AuthComponent),

  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('../app/auth-callback/auth-callback.component').then(
        (m) => m.AuthCallbackComponent
      ),
  },
  {
    path: 'match',
    loadComponent: () =>
      import('./features/match/match-list..component').then(
        (m) => m.MatchComponent
      ),

  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./features/stats/stats.component').then((m) => m.StatsComponent),

  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then((m) => m.AdminComponent),

  },
  {
    path: 'ranking',
    loadComponent: () =>
      import('./features/leaderboard/leaderboard.component').then(
        (m) => m.LeaderboardComponent
      ),

  },
];
