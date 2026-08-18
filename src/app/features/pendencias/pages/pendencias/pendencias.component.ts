import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PendingDetailsComponent } from './components/pending-details/pending-details.component';
import { PendingFiltersComponent } from './components/pending-filters/pending-filters.component';
import { PendingListComponent } from './components/pending-list/pending-list.component';
import { PendingSummaryComponent } from './components/pending-summary/pending-summary.component';

@Component({
  selector: 'app-pendencias',
  standalone: true,
  imports: [
    PendingDetailsComponent,
    PendingFiltersComponent,
    PendingListComponent,
    PendingSummaryComponent,
  ],
  templateUrl: './pendencias.component.html',
  styleUrl: './pendencias.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendenciasComponent {}
