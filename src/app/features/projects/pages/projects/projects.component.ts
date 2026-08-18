import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { getProjectStatusView } from '../../../../core/models/project-status.view';
import { Project, ProjectStatus } from '../../../../core/models/project.model';
import { ProjectService } from '../../../../core/services/project.service';

type ProjectFilter = ProjectStatus | 'ALL';

interface ProjectFilterOption {
  label: string;
  value: ProjectFilter;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  private readonly projectService = inject(ProjectService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly projects = signal<Project[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedFilter = signal<ProjectFilter>('ALL');

  protected readonly filterOptions: ProjectFilterOption[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Em desenvolvimento', value: 'DEVELOPMENT' },
    { label: 'Em homologacao', value: 'HOMOLOGATION' },
    { label: 'Alteracoes solicitadas', value: 'CHANGES_REQUESTED' },
    { label: 'Aprovados', value: 'APPROVED' },
    { label: 'Em producao', value: 'PRODUCTION' },
    { label: 'Concluidos', value: 'COMPLETED' },
  ];

  protected readonly summary = computed(() => {
    const projects = this.projects();

    return {
      total: projects.length,
      active: projects.filter((project) =>
        ['DEVELOPMENT', 'HOMOLOGATION', 'CHANGES_REQUESTED'].includes(project.status),
      ).length,
      homologation: projects.filter((project) => project.status === 'HOMOLOGATION').length,
      completed: projects.filter((project) =>
        ['APPROVED', 'PRODUCTION', 'COMPLETED'].includes(project.status),
      ).length,
    };
  });

  protected readonly filteredProjects = computed(() => {
    const filter = this.selectedFilter();
    const search = this.searchTerm().trim().toLowerCase();

    return this.projects().filter((project) => {
      const matchesFilter = filter === 'ALL' || project.status === filter;
      const matchesSearch =
        search.length === 0 ||
        project.name.toLowerCase().includes(search) ||
        (project.clientName ?? '').toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  });

  constructor() {
    this.loadProjects();
  }

  protected loadProjects(): void {
    this.loading.set(true);
    this.error.set(false);

    this.projectService
      .getProjects()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (projects) => this.projects.set(projects),
        error: () => {
          this.projects.set([]);
          this.error.set(true);
        },
      });
  }

  protected setFilter(filter: ProjectFilter): void {
    this.selectedFilter.set(filter);
  }

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected getStatusLabel(status: ProjectStatus): string {
    return getProjectStatusView(status).label;
  }

  protected getStatusTone(status: ProjectStatus): string {
    return getProjectStatusView(status).tone;
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
