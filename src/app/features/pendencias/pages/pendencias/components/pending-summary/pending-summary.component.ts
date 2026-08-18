import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pending-summary',
  standalone: true,
  templateUrl: './pending-summary.component.html',
  styleUrl: './pending-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingSummaryComponent {}
