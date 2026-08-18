import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pending-list',
  standalone: true,
  templateUrl: './pending-list.component.html',
  styleUrl: './pending-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingListComponent {}
