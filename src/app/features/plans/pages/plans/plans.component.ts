import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BillingHistoryComponent } from './components/billing-history/billing-history.component';
import { CurrentPlanComponent } from './components/current-plan/current-plan.component';
import { PlanOptionsComponent } from './components/plan-options/plan-options.component';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [BillingHistoryComponent, CurrentPlanComponent, PlanOptionsComponent],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {}
