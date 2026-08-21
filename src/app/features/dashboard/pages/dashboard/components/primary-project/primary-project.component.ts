import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { getProjectStatusView, ProjectStatusView } from '../../../../../../core/models/project-status.view';
import { Project } from '../../../../../../core/models/project.model';

@Component({
  selector: 'app-primary-project',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './primary-project.component.html',
  styleUrl: './primary-project.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryProjectComponent {
  readonly project = input<Project | null>(null);

  protected statusView(project: Project): ProjectStatusView {
    return getProjectStatusView(project.status);
  }

  protected getHostname(url: string): string {
    return new URL(url).hostname;
  }

  protected formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
