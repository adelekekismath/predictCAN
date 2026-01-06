import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './features/navbar/navbar.component';
import { ToastComponent } from './features/toast/toast.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,NavbarComponent,ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'predictCAN';
}
