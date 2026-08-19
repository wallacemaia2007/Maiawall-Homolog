import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  OnDestroy,
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
export class ModalTemplateComponent implements AfterViewInit, OnDestroy {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly description = input('');
  readonly closeLabel = input('Fechar modal');
  readonly isOpen = input(true);

  readonly closed = output<void>();
  protected readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private dialogRef: HTMLDialogElement | null = null;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (this.dialogRef) {
        if (open && !this.dialogRef.open) {
          this.dialogRef.showModal();
        } else if (!open && this.dialogRef.open) {
          this.dialogRef.close();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.dialogRef = this.dialog().nativeElement;
    if (this.isOpen() && !this.dialogRef.open) {
      this.dialogRef.showModal();
    }
  }

  ngOnDestroy(): void {
    if (this.dialogRef && this.dialogRef.open) {
      this.dialogRef.close();
    }
    this.dialogRef = null;
  }

  protected close(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

}