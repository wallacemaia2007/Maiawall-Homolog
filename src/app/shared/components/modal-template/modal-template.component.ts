import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-modal-template',
  standalone: true,
  templateUrl: './modal-template.component.html',
  styleUrl: './modal-template.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalTemplateComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly description = input('');
  readonly closeLabel = input('Fechar modal');

  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.closed.emit();
  }
}
