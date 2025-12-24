import { Routes } from '@angular/router';
import { HomeComponent } from '../app/features/home/home.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../app/features/home/home.component').then(m => m.HomeComponent)
  }
];
