import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './match-form.component.html'
})
export class MatchFormComponent {
  private fb = inject(FormBuilder);

  @Input({ required: true }) teams: any[] = [];
  @Output() submitted = new EventEmitter<FormGroup>();

  isFormVisible = signal(false);

  stages = ['8ème de finale', 'Quart de finale', 'Demi-finales', 'Match pour la 3ème place', 'Finale'];

  matchForm: FormGroup = this.fb.group({
    team_a: [null, Validators.required],
    team_b: [null, Validators.required],
    kickoff_time: ['', Validators.required],
    status: ['Quart de finale', Validators.required]
  });

  toggleForm() {
    this.isFormVisible.update(v => !v);
  }

  onSubmit() {
    if (this.matchForm.valid) {
      this.submitted.emit(this.matchForm);
      this.matchForm.reset({ status: 'Quart de finale' });
      this.isFormVisible.set(false);
    }
  }
}
