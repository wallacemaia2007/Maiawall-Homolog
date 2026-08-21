import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlanIncludedItem } from '../../../../models/plan.model';

@Component({
  selector: 'app-plan-included-items',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-included-items.component.html',
  styleUrl: './plan-included-items.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanIncludedItemsComponent {
  readonly items = input.required<PlanIncludedItem[]>();
  readonly title = input('Serviços inclusos');
  readonly subtitle = input('O que está incluso neste plano');
}
