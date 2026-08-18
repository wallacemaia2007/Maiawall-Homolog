import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import gsap from 'gsap';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly shapeHoverColor = '#26282D';
  private readonly shapeCellSize = 36;

  @ViewChild('shapeGrid') private shapeGrid?: ElementRef<HTMLElement>;

  protected readonly shapeCells = signal<number[]>([]);

  ngAfterViewInit(): void {
    const shapeGrid = this.shapeGrid?.nativeElement;
    const resizeObserver = shapeGrid
      ? new ResizeObserver(() => this.syncShapeCells(shapeGrid))
      : null;

    if (shapeGrid) {
      this.syncShapeCells(shapeGrid);
      resizeObserver?.observe(shapeGrid);
    }

    if (this.reduceMotion) {
      this.destroyRef.onDestroy(() => resizeObserver?.disconnect());
      return;
    }

    const context = gsap.context(() => {
      gsap
        .timeline({
          defaults: {
            duration: 0.72,
            ease: 'power3.out',
          },
        })
        .from('[data-animate="panel"]', { xPercent: -10, opacity: 0 })
        .from('[data-animate="brand"]', { y: 18, opacity: 0 }, '-=0.42')
        .from('[data-animate="headline"]', { y: 26, opacity: 0 }, '-=0.32');
    }, this.host.nativeElement);

    this.destroyRef.onDestroy(() => {
      resizeObserver?.disconnect();
      context.revert();
    });
  }

  private syncShapeCells(grid: HTMLElement): void {
    const { width, height } = grid.getBoundingClientRect();
    const columns = Math.ceil(width / this.shapeCellSize);
    const rows = Math.ceil(height / this.shapeCellSize);
    const totalCells = columns * rows;

    if (totalCells !== this.shapeCells().length) {
      this.shapeCells.set(Array.from({ length: totalCells }, (_, index) => index));
    }
  }

  protected animateShape(event: MouseEvent): void {
    if (this.reduceMotion) {
      return;
    }

    const target = event.currentTarget as HTMLElement;

    gsap
      .timeline({ defaults: { ease: 'power2.inOut' } })
      .set(target, {
        transformPerspective: 700,
        transformOrigin: 'center center',
      })
      .to(target, {
        rotateX: 90,
        duration: 0.16,
        overwrite: true,
      })
      .set(target, {
        backgroundColor: this.shapeHoverColor,
        rotateX: -90,
      })
      .to(target, {
        rotateX: 0,
        duration: 0.22,
      });
  }
}
