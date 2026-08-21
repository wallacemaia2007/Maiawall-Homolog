import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import { getProjectStatusView } from '../../../../core/models/project-status.view';
import {
  Project,
  ProjectActivity,
  ProjectRelease,
  ProjectStatus,
} from '../../../../core/models/project.model';
import { ProjectService } from '../../../../core/services/project.service';
import { InvestmentPlan } from '../../../investments/models/investment.model';
import { InvestmentService } from '../../../investments/services/investment.service';
import {
  Pending,
  PendingStatus,
  getPendingPriorityLabel,
  getPendingStatusView,
} from '../../../pendencias/models/pending.model';
import { PendingService } from '../../../pendencias/services/pending.service';
import { Plan, PlanStatus } from '../../../plans/models/plan.model';
import { PlanService } from '../../../plans/services/plan.service';
import {
  getPlanStatusLabel,
  getPlanStatusTone,
  getPlanBillingCycleLabel,
} from '../../../plans/models/plan.model';
import { ModalProjectApprovalComponent } from '../../components/modal-project-approval/modal-project-approval.component';
import { ModalProjectRevisionComponent } from '../../components/modal-project-revision/modal-project-revision.component';
import { MeetingRequestModalComponent } from '../../../../shared/components/meeting-request-modal/meeting-request-modal.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ModalProjectApprovalComponent,
    ModalProjectRevisionComponent,
    MeetingRequestModalComponent,
  ],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly projectService = inject(ProjectService);
  private readonly investmentService = inject(InvestmentService);
  private readonly planService = inject(PlanService);
  private readonly pendingService = inject(PendingService);
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
  protected readonly releases = signal<ProjectRelease[]>([]);
  protected readonly investments = signal<InvestmentPlan[]>([]);
  protected readonly plans = signal<Plan[]>([]);
  protected readonly pendings = signal<Pending[]>([]);
  protected readonly approvalMessage = signal('');
  protected readonly changesRequested = signal(false);
  protected readonly approvalModalOpen = signal(false);
  protected readonly changeModalOpen = signal(false);
  protected readonly meetingModalOpen = signal(false);
  protected readonly meetingSent = signal(false);

  protected readonly relatedInvestment = computed(() => {
    const project = this.project();

    if (!project) {
      return null;
    }

    return (
      this.investments().find((inv) => inv.id === project.investmentPlanId) ??
      this.investments().find((inv) => inv.projectId === project.id) ??
      null
    );
  });

  protected readonly relatedPlans = computed(() => {
    const project = this.project();
    if (!project) return [];
    return this.plans().filter((plan) => plan.projectId === project.id);
  });

  protected readonly relatedPendings = computed(() => {
    const project = this.project();

    if (!project) {
      return [];
    }

    return this.pendings()
      .filter((pending) => pending.projectId === project.id || pending.project?.id === project.id)
      .sort((first, second) => {
        const priorityDiff =
          this.getPendingPriorityWeight(second.priority) - this.getPendingPriorityWeight(first.priority);

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        const firstPending = this.isPendingStatus(first.status) ? 1 : 0;
        const secondPending = this.isPendingStatus(second.status) ? 1 : 0;

        if (firstPending !== secondPending) {
          return secondPending - firstPending;
        }

        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      });
  });

  protected readonly latestDelivery = computed(() => {
    const latestRelease = [...this.releases()].sort(
      (current, next) => new Date(next.releasedAt).getTime() - new Date(current.releasedAt).getTime(),
    )[0];

    if (latestRelease) {
      return {
        title: latestRelease.title,
        description: latestRelease.description || 'Entrega registrada no changelog do projeto.',
        date: latestRelease.releasedAt,
      };
    }

    const latestActivity = [...this.history()].sort(
      (current, next) => new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime(),
    )[0];

    if (latestActivity) {
      return {
        title: latestActivity.title,
        description: latestActivity.description,
        date: latestActivity.createdAt,
      };
    }

    return null;
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
      releases: this.projectService.getProjectReleases(id),
      investments: this.investmentService.getInvestments(),
      plans: this.planService.getPlans(),
      pendings: this.pendingService.getPendings().pipe(catchError(() => of([] as Pending[]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ project, history, releases, investments, plans, pendings }) => {
          this.project.set(project);
          this.history.set(history);
          this.releases.set(releases);
          this.investments.set(investments);
          this.plans.set(plans);
          this.pendings.set(pendings);
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

  protected openMeetingModal(): void {
    this.meetingSent.set(false);
    this.meetingModalOpen.set(true);
  }

  protected closeMeetingModal(): void {
    this.meetingModalOpen.set(false);
  }

  protected markMeetingSent(): void {
    this.meetingSent.set(true);
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

  protected getNextStep(project: Project): string {
    switch (project.status) {
      case 'DEVELOPMENT':
        return 'Implementação em andamento pela Maiawall.';
      case 'HOMOLOGATION':
        return 'Revisão do cliente no ambiente de homologação.';
      case 'CHANGES_REQUESTED':
        return 'Ajustes solicitados serão analisados e implementados.';
      case 'APPROVED':
        return 'Preparação para publicação ou acompanhamento final.';
      case 'PRODUCTION':
        return 'Projeto em produção com acompanhamento ativo.';
      case 'COMPLETED':
        return 'Projeto concluído e disponível para consulta.';
      default:
        return 'Acompanhamento do projeto em andamento.';
    }
  }

  protected getCurrentResponsible(project: Project): string {
    switch (project.status) {
      case 'HOMOLOGATION':
        return 'Cliente';
      case 'CHANGES_REQUESTED':
      case 'DEVELOPMENT':
      case 'APPROVED':
        return 'Maiawall';
      case 'PRODUCTION':
      case 'COMPLETED':
        return 'Maiawall e cliente';
      default:
        return 'Maiawall';
    }
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

  protected getPlanStatusLabel(status: PlanStatus): string {
    return getPlanStatusLabel(status);
  }

  protected getPlanStatusTone(status: PlanStatus): string {
    return getPlanStatusTone(status);
  }

  protected getBillingCycleLabel(cycle: Plan['billingCycle']): string {
    return getPlanBillingCycleLabel(cycle);
  }

  protected getPendingStatusLabel(status: PendingStatus): string {
    return getPendingStatusView(status).label;
  }

  protected getPendingStatusTone(status: PendingStatus): string {
    return getPendingStatusView(status).tone;
  }

  protected getPendingPriorityLabel(priority?: string): string {
    return getPendingPriorityLabel(priority);
  }

  protected getPendingPriorityTone(priority?: string): string {
    const priorityTones: Record<string, string> = {
      URGENT: 'high',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
    };

    return priority ? (priorityTones[priority.toUpperCase()] ?? 'neutral') : 'neutral';
  }

  protected requiredPendingFields(pending: Pending): number {
    return pending.fields.filter((field) => field.required).length;
  }

  private getPendingPriorityWeight(priority?: string): number {
    const weights: Record<string, number> = {
      URGENT: 4,
      HIGH: 4,
      MEDIUM: 3,
      LOW: 2,
    };

    return priority ? (weights[priority.toUpperCase()] ?? 1) : 1;
  }

  private isPendingStatus(status: PendingStatus): boolean {
    return String(status).toUpperCase() === 'PENDING';
  }
}
