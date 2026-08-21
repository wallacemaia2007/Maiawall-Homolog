import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { CONTACT_DATA } from '../../../../core/data/contact';
import { WhatsAppService } from '../../../../core/services/whatsapp.service';
import { ModalTemplateComponent } from '../../../../shared/components/modal-template/modal-template.component';
import { formatDate } from '../../../../shared/utils/date.utils';
import { PlanWithDetails } from '../../models/plan.model';

@Component({
  selector: 'app-plan-renewal-modal',
  standalone: true,
  imports: [CommonModule, ModalTemplateComponent],
  templateUrl: './plan-renewal-modal.component.html',
  styleUrl: './plan-renewal-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanRenewalModalComponent {
  private readonly whatsAppService = inject(WhatsAppService);

  readonly plan = input.required<PlanWithDetails>();
  readonly closed = output<void>();
  protected readonly renewalRecipient = CONTACT_DATA.email;

  protected close(): void {
    this.closed.emit();
  }

  protected getFinalMonthMessage(): string {
    const plan = this.plan();

    if (plan.daysUntilEnd === 0) {
      return 'Este é o último dia do seu plano. Para continuar com os serviços sem interrupção, fale com o suporte e solicite a renovação.';
    }

    if (plan.daysUntilEnd === 1) {
      return 'Este é o último mês do seu plano. Ele termina em 1 dia. Para continuar com os serviços sem interrupção, fale com o suporte e solicite a renovação.';
    }

    return `Este é o último mês do seu plano. Ele termina em ${plan.daysUntilEnd} dias. Para continuar com os serviços sem interrupção, fale com o suporte e solicite a renovação.`;
  }

  protected getCurrentEndDate(): string {
    const endDate = this.plan().endDate;
    return endDate ? formatDate(endDate) : 'Não informado';
  }

  protected confirmRenewal(): void {
    const plan = this.plan();
    const message = this.buildRenewalMessage(plan);

    console.info('Solicitação de renovação pendente de envio por Gmail:', {
      to: this.renewalRecipient,
      subject: `Renovação de plano - ${plan.name}`,
      planId: plan.id,
      projectId: plan.projectId,
      projectName: plan.projectName,
      currentEndDate: plan.endDate ?? null,
      message,
    });

    const phone = this.whatsAppService.getWhatsAppNumber();
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    this.close();
  }

  private buildRenewalMessage(plan: PlanWithDetails): string {
    return [
      'Olá, Wallace! Quero renovar meu plano por mais meses.',
      '',
      `Plano: ${plan.name}`,
      `Projeto: ${plan.projectName}`,
      plan.endDate ? `Término atual: ${formatDate(plan.endDate)}` : '',
      '',
      'Pode me enviar as opções para continuar com o contrato?',
    ].filter(Boolean).join('\n');
  }
}
