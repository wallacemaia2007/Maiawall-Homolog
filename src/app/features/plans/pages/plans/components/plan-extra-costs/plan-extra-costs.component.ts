import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlanExtraCost } from '../../../../models/plan.model';
import { PlanQuoteCartService } from '../../../../services/plan-quote-cart.service';

@Component({
  selector: 'app-plan-extra-costs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-extra-costs.component.html',
  styleUrl: './plan-extra-costs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanExtraCostsComponent {
  protected readonly quoteCart = inject(PlanQuoteCartService);

  readonly extras = input.required<PlanExtraCost[]>();
  readonly title = input('Custos adicionais');
  readonly subtitle = input('Serviços e itens que não fazem parte do plano principal');

  protected isSelected(extraId: string): boolean {
    return this.quoteCart.isSelected(extraId);
  }

  protected toggleExtra(extra: PlanExtraCost): void {
    this.quoteCart.toggle(extra);
  }
}
