import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { getProjectStatusView } from '../../../../../../core/models/project-status.view';
import { Project } from '../../../../../../core/models/project.model';

@Component({
  selector: 'app-project-progress',
  standalone: true,
  templateUrl: './project-progress.component.html',
  styleUrl: './project-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectProgressComponent {
  readonly project = input<Project | null>(null);

  protected readonly progressBackground = computed(() => {
    const progress = this.project()?.progress ?? 0;

    return `conic-gradient(var(--color-primary) ${progress * 3.6}deg, #ececf1 0deg)`;
  });

  protected statusLabel(project: Project): string {
    return getProjectStatusView(project.status).label;
  }
}
