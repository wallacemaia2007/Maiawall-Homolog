import { ChangeDetectionStrategy, Component, signal, output } from '@angular/core';

import { ModalTemplateComponent } from '../../../../shared/components/modal-template/modal-template.component';

@Component({
  selector: 'app-modal-project-revision',
  standalone: true,
  imports: [ModalTemplateComponent],
  templateUrl: './modal-project-revision.component.html',
  styleUrl: './modal-project-revision.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalProjectRevisionComponent {
  readonly cancelled = output<void>();
  readonly submitted = output<string>();

  protected readonly message = signal('');

  protected updateMessage(value: string): void {
    this.message.set(value);
  }

  protected submit(): void {
    const message = this.message().trim();

    if (message) {
      this.submitted.emit(message);
    }
  }
}
