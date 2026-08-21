import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { catchError, combineLatest, map, of, shareReplay } from 'rxjs';

import { Project, ProjectStatus } from '../../../../core/models/project.model';
import { PlanWithDetails } from '../../models/plan.model';
import { PlanService } from '../../services/plan.service';
import { ProjectService } from '../../../../core/services/project.service';
import { PlanCardComponent } from './components/plan-card/plan-card.component';
import { PlanIncludedItemsComponent } from './components/plan-included-items/plan-included-items.component';
import { PlanExtraCostsComponent } from './components/plan-extra-costs/plan-extra-costs.component';
import { PlanPaymentsComponent } from './components/plan-payments/plan-payments.component';

interface ProjectPlanGroup {
  id: string;
  projectName: string;
  projectStatus?: ProjectStatus;
  plans: PlanWithDetails[];
}

interface PlanDueAlert {
  tone: 'warning' | 'danger';
  message: string;
}

interface PlansViewModel {
  groups: ProjectPlanGroup[];
  totalPlans: number;
  activePlans: number;
  totalMonthly: number;
  hasPlans: boolean;
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [
    CommonModule,
    PlanCardComponent,
    PlanIncludedItemsComponent,
    PlanExtraCostsComponent,
    PlanPaymentsComponent,
  ],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  private readonly planService = inject(PlanService);
  private readonly projectService = inject(ProjectService);
  protected readonly expandedGroupIds = new Set<string>();

  protected readonly viewModel$ = combineLatest({
    projects: this.projectService.getProjects().pipe(
      catchError((error) => {
        console.error('Error fetching projects for plans page:', error);
        return of([]);
      }),
    ),
    plans: this.planService.getPlansWithDetails(),
  }).pipe(
    map(({ projects, plans }) => this.buildViewModel(projects, plans)),
    shareReplay(1),
  );

  private buildViewModel(projects: Project[], plans: PlanWithDetails[]): PlansViewModel {
    const groups = this.groupPlansByProject(projects, plans);
    const summary = this.planService.calculateSummary(plans);

    return {
      groups,
      totalPlans: plans.length,
      activePlans: summary.activePlans,
      totalMonthly: summary.totalMonthly,
      hasPlans: plans.length > 0,
    };
  }

  private groupPlansByProject(projects: Project[], plans: PlanWithDetails[]): ProjectPlanGroup[] {
    const projectsById = new Map(projects.map((project) => [project.id, project]));
    const groups = new Map<string, ProjectPlanGroup>();

    plans.forEach((plan) => {
      const project = projectsById.get(plan.projectId);
      const groupId = plan.projectId || `plan-${plan.id}`;
      const existingGroup = groups.get(groupId);

      if (existingGroup) {
        existingGroup.plans.push(plan);
        return;
      }

      groups.set(groupId, {
        id: groupId,
        projectName: project?.name ?? plan.projectName ?? 'Projeto não vinculado',
        projectStatus: project?.status,
        plans: [plan],
      });
    });

    return Array.from(groups.values());
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  protected getProjectStatusLabel(status: ProjectStatus | undefined): string {
    if (!status) {
      return 'Sem projeto';
    }

    const labels: Record<ProjectStatus, string> = {
      DEVELOPMENT: 'Desenvolvimento',
      HOMOLOGATION: 'Homologação',
      CHANGES_REQUESTED: 'Ajustes solicitados',
      APPROVED: 'Aprovado',
      PRODUCTION: 'Produção',
      COMPLETED: 'Concluído',
    };
    return labels[status] ?? status;
  }

  protected getProjectStatusClass(status: ProjectStatus | undefined): string {
    return status ? `status-${status.toLowerCase()}` : 'status-unlinked';
  }

  protected getGroupDueAlert(group: ProjectPlanGroup): PlanDueAlert | null {
    const plansWithDueDate = group.plans.filter((plan) => plan.daysRemaining !== undefined);
    const overduePlan = plansWithDueDate
      .filter((plan) => (plan.daysRemaining ?? 0) < 0)
      .sort((current, next) => (current.daysRemaining ?? 0) - (next.daysRemaining ?? 0))[0];

    if (overduePlan?.daysRemaining !== undefined) {
      const overdueDays = Math.abs(overduePlan.daysRemaining);
      return {
        tone: 'danger',
        message: overdueDays === 1
          ? 'Este plano está atrasado há 1 dia.'
          : `Este plano está atrasado há ${overdueDays} dias.`,
      };
    }

    const dueSoonPlan = plansWithDueDate
      .filter((plan) => {
        const daysRemaining = plan.daysRemaining ?? Number.POSITIVE_INFINITY;
        return daysRemaining >= 0 && daysRemaining <= 7;
      })
      .sort((current, next) => (current.daysRemaining ?? 0) - (next.daysRemaining ?? 0))[0];

    if (dueSoonPlan?.daysRemaining !== undefined) {
      if (dueSoonPlan.daysRemaining === 0) {
        return {
          tone: 'warning',
          message: 'Este plano vence hoje.',
        };
      }

      return {
        tone: 'warning',
        message: dueSoonPlan.daysRemaining === 1
          ? 'Este plano vence em 1 dia.'
          : `Este plano vence em ${dueSoonPlan.daysRemaining} dias.`,
      };
    }

    return null;
  }

  protected getGroupDueBorderColor(group: ProjectPlanGroup): string | null {
    const alert = this.getGroupDueAlert(group);
    if (alert?.tone === 'warning') {
      return '#e6b94b';
    }
    if (alert?.tone === 'danger') {
      return '#d84a3a';
    }
    return null;
  }

  protected isGroupExpanded(groupId: string): boolean {
    return this.expandedGroupIds.has(groupId);
  }

  protected toggleGroup(groupId: string): void {
    if (this.expandedGroupIds.has(groupId)) {
      this.expandedGroupIds.delete(groupId);
      return;
    }

    this.expandedGroupIds.add(groupId);
  }

  protected getGroupPanelId(groupId: string): string {
    return `plans-group-${groupId}`;
  }
}
