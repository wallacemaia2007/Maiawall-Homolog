import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pending-details',
  standalone: true,
  templateUrl: './pending-details.component.html',
  styleUrl: './pending-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingDetailsComponent {}
