import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-modal-template',
  standalone: true,
  templateUrl: './modal-template.component.html',
  styleUrl: './modal-template.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalTemplateComponent implements AfterViewInit {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly description = input('');
  readonly closeLabel = input('Fechar modal');

  readonly closed = output<void>();
  protected readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  ngAfterViewInit(): void {
    const dialog = this.dialog().nativeElement;

    if (!dialog.open) {
      dialog.showModal();
    }
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

}
