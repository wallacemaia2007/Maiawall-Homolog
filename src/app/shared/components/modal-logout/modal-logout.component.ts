import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { ModalTemplateComponent } from '../modal-template/modal-template.component';

@Component({
  selector: 'app-modal-logout',
  standalone: true,
  imports: [ModalTemplateComponent],
  templateUrl: './modal-logout.component.html',
  styleUrl: './modal-logout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalLogoutComponent {
  readonly cancelled = output<void>();
  readonly confirmed = output<void>();
}
