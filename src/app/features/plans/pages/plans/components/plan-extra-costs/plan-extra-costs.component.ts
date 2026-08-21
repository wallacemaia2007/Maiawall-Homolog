import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlanExtraCost } from '../../../../models/plan.model';
import { CONTACT_DATA } from '../../../../../../core/data/contact';
import { WhatsAppService } from '../../../../../../core/services/whatsapp.service';

@Component({
  selector: 'app-plan-extra-costs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-extra-costs.component.html',
  styleUrl: './plan-extra-costs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanExtraCostsComponent implements OnDestroy {
  private readonly whatsAppService = inject(WhatsAppService);
  private readonly closeAnimationMs = 220;
  private quoteDialog?: HTMLDialogElement;
  private closeAnimationTimeout?: ReturnType<typeof setTimeout>;

  readonly extras = input.required<PlanExtraCost[]>();
  readonly title = input('Custos adicionais');
  readonly subtitle = input('Serviços e itens que não fazem parte do plano principal');
  protected readonly selectedExtraIds = signal<Set<string>>(new Set());
  protected readonly isQuotePanelOpen = signal(false);
  protected readonly isQuotePanelClosing = signal(false);
  protected readonly selectedExtras = computed(() =>
    this.extras().filter((extra) => this.selectedExtraIds().has(extra.id)),
  );
  protected readonly quoteRecipient = CONTACT_DATA.email;

  protected readonly statusLabels: Record<string, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    PAUSED: 'Pausado',
  };

  protected isSelected(extraId: string): boolean {
    return this.selectedExtraIds().has(extraId);
  }

  protected toggleExtra(extra: PlanExtraCost): void {
    this.selectedExtraIds.update((selectedIds) => {
      const nextSelectedIds = new Set(selectedIds);

      if (nextSelectedIds.has(extra.id)) {
        nextSelectedIds.delete(extra.id);
      } else {
        nextSelectedIds.add(extra.id);
      }

      return nextSelectedIds;
    });

    if (this.selectedExtraIds().size > 0) {
      this.openQuotePanel();
      return;
    }

    this.closeQuotePanel();
  }

  protected removeExtra(extraId: string): void {
    this.selectedExtraIds.update((selectedIds) => {
      const nextSelectedIds = new Set(selectedIds);
      nextSelectedIds.delete(extraId);
      return nextSelectedIds;
    });

    if (this.selectedExtraIds().size === 0) {
      this.closeQuotePanel();
    }
  }

  protected closeQuotePanel(): void {
    this.clearCloseAnimationTimeout();

    if (!this.quoteDialog?.open) {
      this.isQuotePanelOpen.set(false);
      this.isQuotePanelClosing.set(false);
      this.syncQuoteDialog();
      return;
    }

    this.isQuotePanelClosing.set(true);
    this.closeAnimationTimeout = setTimeout(() => {
      this.isQuotePanelOpen.set(false);
      this.isQuotePanelClosing.set(false);
      this.syncQuoteDialog();
    }, this.closeAnimationMs);
  }

  protected onQuoteDialogClose(): void {
    this.clearCloseAnimationTimeout();
    if (this.isQuotePanelOpen()) {
      this.isQuotePanelOpen.set(false);
    }
    this.isQuotePanelClosing.set(false);
  }

  protected onQuoteDialogClick(event: MouseEvent): void {
    if (event.target === this.quoteDialog) {
      this.closeQuotePanel();
    }
  }

  protected onQuoteDialogCancel(event: Event): void {
    event.preventDefault();
    this.closeQuotePanel();
  }

  protected requestQuote(): void {
    const selectedItems = this.selectedExtras();
    if (selectedItems.length === 0) {
      return;
    }

    const itemList = selectedItems.map((extra) => `- ${extra.name}`).join('\n');
    const message = [
      'Olá, Wallace! Quero solicitar um orçamento para os seguintes serviços extras:',
      '',
      itemList,
      '',
      'Pode me enviar mais informações?',
    ].join('\n');

    console.info('Solicitação de orçamento pendente de envio por Gmail:', {
      to: this.quoteRecipient,
      items: selectedItems.map((extra) => extra.name),
    });

    const phone = this.whatsAppService.getWhatsAppNumber();
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  protected getStatusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  protected getStatusTone(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'neutral';
      case 'PAUSED':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  @ViewChild('quoteDialog')
  private set quoteDialogElement(element: ElementRef<HTMLDialogElement> | undefined) {
    this.quoteDialog = element?.nativeElement;
    this.syncQuoteDialog();
  }

  private syncQuoteDialog(): void {
    queueMicrotask(() => {
      const dialog = this.quoteDialog;
      if (!dialog) {
        return;
      }

      if (this.isQuotePanelOpen() && !dialog.open) {
        dialog.showModal();
        return;
      }

      if (!this.isQuotePanelOpen() && dialog.open) {
        dialog.close();
      }
    });
  }

  private openQuotePanel(): void {
    this.clearCloseAnimationTimeout();
    this.isQuotePanelClosing.set(false);
    this.isQuotePanelOpen.set(true);
    this.syncQuoteDialog();
  }

  private clearCloseAnimationTimeout(): void {
    if (this.closeAnimationTimeout) {
      clearTimeout(this.closeAnimationTimeout);
      this.closeAnimationTimeout = undefined;
    }
  }

  ngOnDestroy(): void {
    this.clearCloseAnimationTimeout();
  }
}
