import { Routes } from '@angular/router';
import { HomeComponent } from '../app/features/home/home.component';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../app/features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    loadComponent: () => import('../app/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('../app/features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { path: 'auth/callback',
    loadComponent: () => import('../app/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
   },
   {
    path: 'match',
    loadComponent: () => import('./features/match/match.component').then(m => m.MatchComponent)
   },
    {
      path: 'stats',
      loadComponent: () => import('./features/stats/stats.component').then(m => m.StatsComponent)
    },
    {
      path: 'admin',
      loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
    },
    {
      path: 'ranking',
      loadComponent: () => import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
    }
];
