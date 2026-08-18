import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-plan-options',
  standalone: true,
  templateUrl: './plan-options.component.html',
  styleUrl: './plan-options.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanOptionsComponent {}
