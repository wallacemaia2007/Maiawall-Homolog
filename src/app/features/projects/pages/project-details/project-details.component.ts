import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { getProjectStatusView } from '../../../../core/models/project-status.view';
import {
  Project,
  ProjectActivity,
  ProjectChange,
  ProjectCommit,
  ProjectRelease,
  ProjectStatus,
} from '../../../../core/models/project.model';
import { ProjectService } from '../../../../core/services/project.service';
import { InvestmentPlan } from '../../../investments/models/investment.model';
import { InvestmentService } from '../../../investments/services/investment.service';
import { ModalProjectApprovalComponent } from '../../components/modal-project-approval/modal-project-approval.component';
import { ModalProjectRevisionComponent } from '../../components/modal-project-revision/modal-project-revision.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ModalProjectApprovalComponent,
    ModalProjectRevisionComponent,
  ],
  templateUrl: './project-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly projectService = inject(ProjectService);
  private readonly investmentService = inject(InvestmentService);
  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  private readonly dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  private readonly dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly project = signal<Project | null>(null);
  protected readonly history = signal<ProjectActivity[]>([]);
  protected readonly commits = signal<ProjectCommit[]>([]);
  protected readonly releases = signal<ProjectRelease[]>([]);
  protected readonly investments = signal<InvestmentPlan[]>([]);
  protected readonly approvalMessage = signal('');
  protected readonly changesRequested = signal(false);
  protected readonly approvalModalOpen = signal(false);
  protected readonly changeModalOpen = signal(false);

  protected readonly relatedInvestment = computed(() => {
    const project = this.project();

    if (!project) {
      return null;
    }

    return (
      this.investments().find((plan) => plan.id === project.investmentPlanId) ??
      this.investments().find((plan) => plan.projectId === project.id) ??
      null
    );
  });

  constructor() {
    this.loadProject();
  }

  protected loadProject(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      project: this.projectService.getProjectById(id),
      history: this.projectService.getProjectHistory(id),
      commits: this.projectService.getProjectCommits(id),
      releases: this.projectService.getProjectReleases(id),
      investments: this.investmentService.getPlans(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ project, history, commits, releases, investments }) => {
          this.project.set(project);
          this.history.set(history);
          this.commits.set(commits);
          this.releases.set(releases);
          this.investments.set(investments);
          this.error.set(!project);
        },
        error: () => this.error.set(true),
      });
  }

  protected goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigateByUrl('/projects');
  }

  protected approveProject(project: Project): void {
    this.projectService.approveProject(project.id).subscribe((approvedProject) => {
      if (approvedProject) {
        this.project.set(approvedProject);
        this.changesRequested.set(false);
        this.approvalMessage.set('Projeto aprovado');
        this.closeApprovalModal();
      }
    });
  }

  protected openApprovalModal(): void {
    this.approvalModalOpen.set(true);
  }

  protected closeApprovalModal(): void {
    this.approvalModalOpen.set(false);
  }

  protected openChangeModal(): void {
    this.changeModalOpen.set(true);
  }

  protected closeChangeModal(): void {
    this.changeModalOpen.set(false);
  }

  protected submitChangeRequest(project: Project, message: string): void {
    if (!message) {
      return;
    }

    this.projectService.requestChanges(project.id, message).subscribe(() => {
      this.changesRequested.set(true);
      this.approvalMessage.set('Alteracoes solicitadas');
      this.closeChangeModal();
    });
  }

  protected getStatusLabel(status: ProjectStatus): string {
    return getProjectStatusView(status).label;
  }

  protected getStatusTone(status: ProjectStatus): string {
    return getProjectStatusView(status).tone;
  }

  protected formatDate(value: string): string {
    return this.dateFormatter.format(new Date(value));
  }

  protected formatDateTime(value: string): string {
    return this.dateTimeFormatter.format(new Date(value));
  }

  protected formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  protected getChangesByType(
    release: ProjectRelease,
    type: ProjectChange['type'],
  ): ProjectChange[] {
    return release.changes.filter((change) => change.type === type);
  }
}
