import { computed, Injectable, signal } from '@angular/core';

import { PlanExtraCost } from '../models/plan.model';

@Injectable({
  providedIn: 'root',
})
export class PlanQuoteCartService {
  private readonly closeAnimationMs = 220;
  private readonly selectedExtras = signal<Map<string, PlanExtraCost>>(new Map());
  private closeAnimationTimeout?: ReturnType<typeof setTimeout>;

  readonly items = computed(() => Array.from(this.selectedExtras().values()));
  readonly itemCount = computed(() => this.selectedExtras().size);
  readonly isOpen = signal(false);
  readonly isClosing = signal(false);

  isSelected(extraId: string): boolean {
    return this.selectedExtras().has(extraId);
  }

  toggle(extra: PlanExtraCost): void {
    if (this.isSelected(extra.id)) {
      this.remove(extra.id);
      return;
    }

    this.add(extra);
  }

  add(extra: PlanExtraCost): void {
    this.selectedExtras.update((items) => {
      const nextItems = new Map(items);
      nextItems.set(extra.id, extra);
      return nextItems;
    });
    this.open();
  }

  remove(extraId: string): void {
    this.selectedExtras.update((items) => {
      const nextItems = new Map(items);
      nextItems.delete(extraId);
      return nextItems;
    });
  }

  clear(): void {
    this.selectedExtras.set(new Map());
  }

  open(): void {
    this.clearCloseAnimationTimeout();
    this.isClosing.set(false);
    this.isOpen.set(true);
  }

  close(): void {
    this.clearCloseAnimationTimeout();

    if (!this.isOpen()) {
      this.isClosing.set(false);
      return;
    }

    this.isClosing.set(true);
    this.closeAnimationTimeout = setTimeout(() => {
      this.isOpen.set(false);
      this.isClosing.set(false);
    }, this.closeAnimationMs);
  }

  closeImmediately(): void {
    this.clearCloseAnimationTimeout();
    this.isOpen.set(false);
    this.isClosing.set(false);
  }

  private clearCloseAnimationTimeout(): void {
    if (this.closeAnimationTimeout) {
      clearTimeout(this.closeAnimationTimeout);
      this.closeAnimationTimeout = undefined;
    }
  }
}
