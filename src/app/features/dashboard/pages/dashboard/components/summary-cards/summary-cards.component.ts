import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface DashboardSummary {
  total: number;
  active: number;
  approved: number;
}

export interface SummaryCardItem {
  label: string;
  value: number | string;
  highlight?: boolean;
}

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  templateUrl: './summary-cards.component.html',
  styleUrl: './summary-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCardsComponent {
  readonly summary = input<DashboardSummary | null>(null);
  readonly cards = input<SummaryCardItem[] | null>(null);
  readonly ariaLabel = input('Resumo rapido');
  readonly compact = input(false);

  protected readonly displayCards = computed<SummaryCardItem[]>(() => {
    const cards = this.cards();

    if (cards) {
      return cards;
    }

    const summary = this.summary();

    if (!summary) {
      return [];
    }

    return [
      { label: 'Projetos', value: summary.total },
      { label: 'Em andamento', value: summary.active },
      { label: 'Aprovados', value: summary.approved },
    ];
  });
}
