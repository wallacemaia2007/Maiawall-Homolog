import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pending-filters',
  standalone: true,
  templateUrl: './pending-filters.component.html',
  styleUrl: './pending-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingFiltersComponent {}
