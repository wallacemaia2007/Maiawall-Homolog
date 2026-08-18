import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-billing-history',
  standalone: true,
  templateUrl: './billing-history.component.html',
  styleUrl: './billing-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingHistoryComponent {}
