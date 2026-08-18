import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ModalTemplateComponent } from '../../../../shared/components/modal-template/modal-template.component';

@Component({
  selector: 'app-modal-project-approval',
  standalone: true,
  imports: [ModalTemplateComponent],
  templateUrl: './modal-project-approval.component.html',
  styleUrl: './modal-project-approval.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalProjectApprovalComponent {
  readonly projectName = input.required<string>();

  readonly cancelled = output<void>();
  readonly confirmed = output<void>();
}
