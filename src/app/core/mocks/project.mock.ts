import { Project, ProjectActivity, ProjectCommit, ProjectRelease } from '../models/project.model';

export const PROJECT_MOCKS: Project[] = [
  {
    id: 'site-institucional',
    name: 'Site Institucional',
    description:
      'Evolucao da presenca digital principal com paginas comerciais, SEO tecnico e jornada de conversao.',
    clientName: 'Maiawall Tech',
    isPrimary: true,
    status: 'HOMOLOGATION',
    progress: 78,
    version: 'v1.4.0',
    createdAt: '2026-08-10',
    updatedAt: '2026-08-18T10:42:00',
    investmentPlanId: 'site-institucional-desenvolvimento',
    homologationUrl: 'https://homolog.maiawall.com',
    productionUrl: 'https://maiawall.com',
    imageUrl:
      'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Pagina de captacao para campanhas e apresentacao de oferta.',
    clientName: 'Maiawall Tech',
    isPrimary: false,
    status: 'DEVELOPMENT',
    progress: 45,
    version: 'v0.9.2',
    createdAt: '2026-08-05',
    updatedAt: '2026-08-17T16:20:00',
    investmentPlanId: 'landing-page-premium',
    homologationUrl: 'https://landing-homolog.maiawall.com',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'sistema-administrativo',
    name: 'Sistema Administrativo',
    description: 'Painel interno para operacao, metricas comerciais e gestao de conteudos.',
    clientName: 'Maiawall Tech',
    isPrimary: false,
    status: 'APPROVED',
    progress: 100,
    version: 'v2.1.0',
    createdAt: '2026-07-18',
    updatedAt: '2026-08-16T14:10:00',
    homologationUrl: 'https://admin-homolog.maiawall.com',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Vitrine profissional publicada com projetos, contato e performance otimizada.',
    clientName: 'Maiawall Tech',
    isPrimary: false,
    status: 'PRODUCTION',
    progress: 100,
    version: 'v1.0.0',
    createdAt: '2026-06-28',
    updatedAt: '2026-08-12T09:30:00',
    productionUrl: 'https://portfolio.maiawall.com',
    imageUrl:
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80',
  },
];

export const PROJECT_ACTIVITY_MOCKS: ProjectActivity[] = [
  {
    id: 'site-v140-published',
    projectId: 'site-institucional',
    title: 'Nova versao publicada',
    version: 'v1.4.0',
    description: 'Ajustes na pagina de contato e melhorias de responsividade.',
    createdAt: '2026-08-18T10:42:00',
  },
  {
    id: 'site-v130-services',
    projectId: 'site-institucional',
    title: 'Alteracoes realizadas',
    version: 'v1.3.0',
    description: 'Nova secao de servicos preparada para homologacao.',
    createdAt: '2026-08-17T18:40:00',
  },
  {
    id: 'site-v120-fixes',
    projectId: 'site-institucional',
    title: 'Projeto atualizado',
    version: 'v1.2.0',
    description: 'Correcoes gerais e refinamentos visuais.',
    createdAt: '2026-08-15T15:10:00',
  },
  {
    id: 'landing-v092-form',
    projectId: 'landing-page',
    title: 'Fluxo em desenvolvimento',
    version: 'v0.9.2',
    description: 'Formulario de captacao e secoes da campanha em ajuste.',
    createdAt: '2026-08-17T16:20:00',
  },
  {
    id: 'admin-v210-approval',
    projectId: 'sistema-administrativo',
    title: 'Projeto aprovado',
    version: 'v2.1.0',
    description: 'Painel administrativo aprovado para preparacao de publicacao.',
    createdAt: '2026-08-16T14:10:00',
  },
  {
    id: 'portfolio-v100-production',
    projectId: 'portfolio',
    title: 'Projeto em producao',
    version: 'v1.0.0',
    description: 'Portfolio publicado com monitoramento inicial concluido.',
    createdAt: '2026-08-12T09:30:00',
  },
];

export const PROJECT_COMMIT_MOCKS: Record<string, ProjectCommit[]> = {
  'site-institucional': [
    {
      id: 'site-commit-1',
      sha: 'a82f91c',
      message: 'fix: ajustes no formulario de contato',
      author: 'Wallace Maia',
      createdAt: '2026-08-18T10:32:00',
      url: 'https://github.com/',
    },
    {
      id: 'site-commit-2',
      sha: 'b72ac12',
      message: 'feat: nova secao de servicos',
      author: 'Wallace Maia',
      createdAt: '2026-08-17T18:40:00',
    },
  ],
  'landing-page': [
    {
      id: 'landing-commit-1',
      sha: 'd19fc84',
      message: 'feat: captura de leads da campanha',
      author: 'Wallace Maia',
      createdAt: '2026-08-17T15:52:00',
    },
  ],
  'sistema-administrativo': [
    {
      id: 'admin-commit-1',
      sha: 'f39ad70',
      message: 'chore: preparar build aprovado',
      author: 'Wallace Maia',
      createdAt: '2026-08-16T14:04:00',
    },
  ],
  portfolio: [
    {
      id: 'portfolio-commit-1',
      sha: 'c540a9e',
      message: 'perf: otimizar imagens publicadas',
      author: 'Wallace Maia',
      createdAt: '2026-08-12T09:22:00',
    },
  ],
};

export const PROJECT_RELEASE_MOCKS: Record<string, ProjectRelease[]> = {
  'site-institucional': [
    {
      id: 'site-release-140',
      version: 'v1.4.0',
      title: 'O que mudou nesta entrega',
      description: 'Atualizacao focada em clareza comercial e experiencia mobile.',
      releasedAt: '2026-08-18T10:42:00',
      changes: [
        { id: 'site-change-1', type: 'feature', label: 'Nova secao de servicos' },
        { id: 'site-change-2', type: 'improvement', label: 'Melhorias no formulario de contato' },
        { id: 'site-change-3', type: 'improvement', label: 'Ajustes para dispositivos moveis' },
        { id: 'site-change-4', type: 'fix', label: 'Corrigido problema no menu mobile' },
      ],
    },
  ],
  'landing-page': [
    {
      id: 'landing-release-092',
      version: 'v0.9.2',
      title: 'Captacao em andamento',
      releasedAt: '2026-08-17T16:20:00',
      changes: [
        { id: 'landing-change-1', type: 'feature', label: 'Bloco de oferta principal' },
        { id: 'landing-change-2', type: 'improvement', label: 'Formulario preparado para validacao' },
      ],
    },
  ],
  'sistema-administrativo': [
    {
      id: 'admin-release-210',
      version: 'v2.1.0',
      title: 'Versao aprovada',
      releasedAt: '2026-08-16T14:10:00',
      changes: [
        { id: 'admin-change-1', type: 'feature', label: 'Dashboard administrativo completo' },
        { id: 'admin-change-2', type: 'fix', label: 'Correcoes finais de permissao' },
      ],
    },
  ],
  portfolio: [
    {
      id: 'portfolio-release-100',
      version: 'v1.0.0',
      title: 'Publicacao inicial',
      releasedAt: '2026-08-12T09:30:00',
      changes: [
        { id: 'portfolio-change-1', type: 'feature', label: 'Portfolio publicado em producao' },
        { id: 'portfolio-change-2', type: 'improvement', label: 'Imagens otimizadas para carregamento' },
      ],
    },
  ],
};
