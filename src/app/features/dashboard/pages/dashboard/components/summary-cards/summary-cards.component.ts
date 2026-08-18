import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface DashboardSummary {
  total: number;
  active: number;
  approved: number;
}

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  templateUrl: './summary-cards.component.html',
  styleUrl: './summary-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCardsComponent {
  readonly summary = input.required<DashboardSummary>();
}
