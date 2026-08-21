import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
} from '@angular/core';

import { CONTACT_DATA } from '../../../../core/data/contact';
import { WhatsAppService } from '../../../../core/services/whatsapp.service';
import { PlanQuoteCartService } from '../../services/plan-quote-cart.service';

@Component({
  selector: 'app-quote-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quote-cart-drawer.component.html',
  styleUrl: './quote-cart-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteCartDrawerComponent {
  private readonly whatsAppService = inject(WhatsAppService);
  private quoteDialog?: HTMLDialogElement;

  protected readonly quoteCart = inject(PlanQuoteCartService);
  protected readonly quoteRecipient = CONTACT_DATA.email;

  constructor() {
    effect(() => {
      this.quoteCart.isOpen();
      this.syncQuoteDialog();
    });
  }

  protected closeQuotePanel(): void {
    this.quoteCart.close();
  }

  protected onQuoteDialogClose(): void {
    this.quoteCart.closeImmediately();
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

  protected removeExtra(extraId: string): void {
    this.quoteCart.remove(extraId);
  }

  protected clearCart(): void {
    this.quoteCart.clear();
  }

  protected requestQuote(): void {
    const selectedItems = this.quoteCart.items();
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

      if (this.quoteCart.isOpen() && !dialog.open) {
        dialog.showModal();
        return;
      }

      if (!this.quoteCart.isOpen() && dialog.open) {
        dialog.close();
      }
    });
  }
}
