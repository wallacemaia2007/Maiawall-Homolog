import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-current-plan',
  standalone: true,
  templateUrl: './current-plan.component.html',
  styleUrl: './current-plan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentPlanComponent {}
