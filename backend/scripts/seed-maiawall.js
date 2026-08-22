require("dotenv").config({ path: __dirname + "/../.env" });

const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const { getDb, closeMongoConnection } = require("../src/database/mongodb");

const COLLECTIONS = [
  "users",
  "projects",
  "projectActivities",
  "projectReleases",
  "projectCommits",
  "investmentPlans",
  "plans",
  "planPayments",
  "installments",
  "notifications",
  "pending",
  "clientSettings",
  "passwordRecoveryTokens",
];

function id() {
  return new ObjectId().toHexString();
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function main() {
  if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
    process.env.MONGODB_URI = process.env.MONGO_URI;
  }
  if (!process.env.MONGODB_DB_NAME && isLocalEnvironment()) {
    process.env.MONGODB_DB_NAME = "maiawall_homolog_local";
  }

  assertSeedAllowed();

  const db = await getDb();
  const now = new Date().toISOString();

  const adminId = id();
  const clientId = id();
  const primaryProjectId = id();
  const homologProjectId = id();
  const mobileProjectId = id();
  const renewalProjectId = id();

  const maintenancePlanId = id();
  const supportPlanId = id();
  const mobileSupportPlanId = id();
  const renewalPlanId = id();

  const investmentPortalId = id();
  const investmentDashboardId = id();
  const investmentMobileId = id();

  const users = [
    {
      id: adminId,
      name: "Wallace Maia",
      email: "admin@maiawall.com",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "ADMIN",
      avatarUrl: "",
      active: true,
      createdAt: now,
      updatedAt: now,
      cpf: "123.456.789-00",
      phone: "(11) 99999-9999",
      birthDate: "1990-01-15",
      gender: "Masculino",
      profession: "Desenvolvedor",
      company: "Maiawall",
      address: {
        cep: "01310-100",
        street: "Av. Paulista",
        number: "1000",
        complement: "Sala 100",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
      },
    },
    {
      id: clientId,
      name: "Cliente Maiawall",
      email: "cliente@maiawall.com",
      passwordHash: await bcrypt.hash("Cliente@123", 10),
      role: "CLIENT",
      avatarUrl: "",
      active: true,
      createdAt: now,
      updatedAt: now,
      cpf: "987.654.321-00",
      phone: "(21) 98888-7777",
      birthDate: "1985-05-20",
      gender: "Feminino",
      profession: "Gerente de Projetos",
      company: "Empresa Cliente",
      address: {
        cep: "22041-001",
        street: "Rua das Flores",
        number: "500",
        complement: "Apto 50",
        neighborhood: "Copacabana",
        city: "Rio de Janeiro",
        state: "RJ",
      },
    },
  ];

  const clientSettings = [
    {
      id: id(),
      clientId,
      companyProfile: {
        displayName: "Empresa Cliente",
        cnpj: "12.345.678/0001-90",
        phone: "(21) 98888-7777",
        commercialEmail: "cliente@maiawall.com",
        address: "Rua das Flores, 500 - Copacabana, Rio de Janeiro - RJ",
        logoUrl: "",
        brandColor: "#4c3ae3",
      },
      notifications: {
        newProjects: true,
        releases: true,
        pendingItems: true,
        installments: true,
        passwordRecovery: true,
        meetings: true,
      },
      meetingPreferences: {
        availableStartTime: "09:00",
        availableEndTime: "18:00",
        reminderMinutes: 60,
      },
      createdAt: now,
      updatedAt: now,
    },
  ];

  const projects = [
    {
      id: primaryProjectId,
      name: "Portal Institucional Maiawall",
      description: "Portal principal em homologação para validação do cliente. Site institucional com blog, área de serviços, formulário de contato e integração com CRM.",
      imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
      clientId,
      isPrimary: true,
      status: "HOMOLOGATION",
      progress: 82,
      version: "v1.4.0",
      productionUrl: "https://maiawall.com",
      homologationUrl: "https://homolog.maiawall.com",
      repositoryUrl: "https://github.com/maiawall/portal",
      createdAt: daysAgo(40),
      updatedAt: now,
    },
    {
      id: homologProjectId,
      name: "Dashboard Operacional",
      description: "Área autenticada para acompanhamento de indicadores, entregas e métricas dos projetos. Gráficos em tempo real, relatórios exportáveis.",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
      clientId,
      isPrimary: false,
      status: "DEVELOPMENT",
      progress: 45,
      version: "v0.8.2",
      productionUrl: "",
      homologationUrl: "https://dashboard-homolog.maiawall.com",
      repositoryUrl: "https://github.com/maiawall/dashboard",
      createdAt: daysAgo(18),
      updatedAt: daysAgo(1),
    },
    {
      id: mobileProjectId,
      name: "App Mobile Cliente",
      description: "Aplicativo mobile para acompanhamento de projetos, visualização de tarefas e comunicação com a equipe.",
      imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&q=80",
      clientId,
      isPrimary: false,
      status: "APPROVED",
      progress: 100,
      version: "v2.1.0",
      productionUrl: "https://app.maiawall.com",
      homologationUrl: "",
      repositoryUrl: "https://github.com/maiawall/mobile",
      createdAt: daysAgo(120),
      updatedAt: daysAgo(30),
    },
    {
      id: renewalProjectId,
      name: "Landing Page Assinatura Mensal",
      description: "Landing page mantida em contrato mensal renovável, com suporte, ajustes leves e acompanhamento contínuo.",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
      clientId,
      isPrimary: false,
      status: "PRODUCTION",
      progress: 100,
      version: "v1.0.0",
      productionUrl: "https://campanha.maiawall.com",
      homologationUrl: "",
      repositoryUrl: "https://github.com/maiawall/landing-assinatura",
      createdAt: daysAgo(75),
      updatedAt: daysAgo(2),
    },
  ];

  const projectActivities = [
    {
      id: id(),
      projectId: primaryProjectId,
      type: "PROJECT_CREATED",
      title: "Projeto criado",
      description: "Kickoff do portal institucional concluído.",
      createdAt: daysAgo(40),
    },
    {
      id: id(),
      projectId: primaryProjectId,
      type: "VERSION_RELEASED",
      title: "Versão v1.4.0 publicada",
      description: "Nova área de serviços e ajustes mobile enviados para homologação.",
      createdAt: daysAgo(3),
    },
    {
      id: id(),
      projectId: homologProjectId,
      type: "STATUS_CHANGED",
      title: "Desenvolvimento em andamento",
      description: "Fluxos internos do dashboard entraram em desenvolvimento.",
      createdAt: daysAgo(1),
    },
    {
      id: id(),
      projectId: mobileProjectId,
      type: "PROJECT_APPROVED",
      title: "Projeto aprovado",
      description: "Cliente aprovou versão 2.1.0 para produção.",
      createdAt: daysAgo(30),
    },
    {
      id: id(),
      projectId: renewalProjectId,
      type: "STATUS_CHANGED",
      title: "Plano no último mês",
      description: "Contrato mensal entrou no período de renovação.",
      createdAt: daysAgo(2),
    },
  ];

  const projectReleases = [
    {
      id: id(),
      projectId: primaryProjectId,
      version: "v1.4.0",
      title: "Homologação do portal",
      description: "Pacote de melhorias visuais e responsivas.",
      changes: [
        { id: "1", label: "Nova seção de serviços", type: "feature" },
        { id: "2", label: "Melhorias no formulário", type: "improvement" },
        { id: "3", label: "Correções mobile", type: "fix" },
      ],
      releasedAt: daysAgo(3),
    },
    {
      id: id(),
      projectId: primaryProjectId,
      version: "v1.3.0",
      title: "Lançamento blog",
      description: "Sistema de blog integrado ao portal.",
      changes: [
        { id: "1", label: "Editor de posts", type: "feature" },
        { id: "2", label: "Categorias e tags", type: "feature" },
        { id: "3", label: "SEO otimizado", type: "improvement" },
      ],
      releasedAt: daysAgo(20),
    },
    {
      id: id(),
      projectId: mobileProjectId,
      version: "v2.1.0",
      title: "Atualização mobile",
      description: "Push notifications e modo offline.",
      changes: [
        { id: "1", label: "Push notifications", type: "feature" },
        { id: "2", label: "Modo offline", type: "feature" },
        { id: "3", label: "Correção sync", type: "fix" },
      ],
      releasedAt: daysAgo(30),
    },
  ];

  const projectCommits = [
    {
      id: id(),
      projectId: primaryProjectId,
      sha: "7fd2a91",
      message: "Ajusta componentes principais da home",
      author: "Wallace Maia",
      createdAt: daysAgo(4),
      url: "https://github.com/maiawall/portal/commit/7fd2a91",
    },
    {
      id: id(),
      projectId: homologProjectId,
      sha: "a03bc82",
      message: "Implementa estrutura inicial do dashboard",
      author: "Wallace Maia",
      createdAt: daysAgo(2),
      url: "https://github.com/maiawall/dashboard/commit/a03bc82",
    },
    {
      id: id(),
      projectId: mobileProjectId,
      sha: "f4e9d21",
      message: "Corrige navegação profunda no iOS",
      author: "Wallace Maia",
      createdAt: daysAgo(35),
      url: "https://github.com/maiawall/mobile/commit/f4e9d21",
    },
  ];

  const plans = [
    {
      id: maintenancePlanId,
      projectId: primaryProjectId,
      projectName: "Portal Institucional Maiawall",
      name: "Plano de Manutenção Mensal",
      description: "Manutenção contínua do portal institucional incluindo correções de bugs, atualizações de segurança, monitoramento e pequenos ajustes.",
      amount: 300,
      billingCycle: "MONTHLY",
      startDate: daysAgo(60),
      endDate: daysFromNow(305),
      status: "ACTIVE",
      includedItems: [
        { id: id(), name: "Correção de bugs", description: "Correção de erros e falhas no portal", status: "INCLUDED" },
        { id: id(), name: "Atualizações de segurança", description: "Aplicação de patches de segurança mensais", status: "INCLUDED" },
        { id: id(), name: "Backup automático", description: "Backup diário do banco de dados e arquivos", status: "INCLUDED" },
        { id: id(), name: "Monitoramento 24/7", description: "Monitoramento de uptime e performance", status: "INCLUDED" },
        { id: id(), name: "Pequenos ajustes", description: "Alterações de texto, cores, imagens (até 4h/mês)", quantity: 4, limit: "4 horas/mês", status: "INCLUDED" },
        { id: id(), name: "Suporte técnico", description: "Atendimento por e-mail e WhatsApp", status: "INCLUDED" },
      ],
      extraCosts: [
        { id: id(), name: "Hospedagem dedicada", description: "Servidor VPS com 4GB RAM, 80GB SSD", amount: 150, periodicity: "MONTHLY", nextDueDate: daysFromNow(5), status: "ACTIVE" },
        { id: id(), name: "Certificado SSL Wildcard", description: "SSL para domínio e subdomínios", amount: 300, periodicity: "ANNUAL", nextDueDate: daysFromNow(120), status: "ACTIVE" },
        { id: id(), name: "CDN Global", description: "Distribuição de conteúdo em edge locations", amount: 80, periodicity: "MONTHLY", nextDueDate: daysFromNow(5), status: "ACTIVE" },
      ],
      payments: [],
      createdAt: daysAgo(60),
      updatedAt: now,
    },
    {
      id: supportPlanId,
      projectId: homologProjectId,
      projectName: "Dashboard Operacional",
      name: "Plano de Suporte Técnico",
      description: "Suporte prioritário para o dashboard operacional com SLA de 4 horas.",
      amount: 500,
      billingCycle: "MONTHLY",
      startDate: daysAgo(15),
      endDate: daysFromNow(350),
      status: "ACTIVE",
      includedItems: [
        { id: id(), name: "Suporte prioritário", description: "Atendimento em até 4h úteis", status: "INCLUDED" },
        { id: id(), name: "Canal dedicado Slack", description: "Canal exclusivo para comunicação", status: "INCLUDED" },
        { id: id(), name: "Relatórios mensais", description: "Relatório de performance e incidentes", status: "INCLUDED" },
        { id: id(), name: "Hotfix emergencial", description: "Correções críticas em até 2h", quantity: 2, limit: "2 por mês", status: "INCLUDED" },
      ],
      extraCosts: [
        { id: id(), name: "Horas extras de desenvolvimento", description: "Além do incluído no plano", amount: 180, periodicity: "ONE_TIME", nextDueDate: null, status: "ACTIVE" },
      ],
      payments: [],
      createdAt: daysAgo(15),
      updatedAt: now,
    },
    {
      id: mobileSupportPlanId,
      projectId: mobileProjectId,
      projectName: "App Mobile Cliente",
      name: "Plano de Suporte Mobile",
      description: "Suporte e monitoramento do aplicativo mobile aprovado, incluindo atualizações, estabilidade e acompanhamento das publicações.",
      amount: 350,
      billingCycle: "MONTHLY",
      startDate: daysAgo(20),
      endDate: daysFromNow(345),
      status: "ACTIVE",
      includedItems: [
        { id: id(), name: "Monitoramento do aplicativo", description: "Acompanhamento de estabilidade, erros e disponibilidade", status: "INCLUDED" },
        { id: id(), name: "Atualizações corretivas", description: "Correções de bugs e ajustes de compatibilidade", status: "INCLUDED" },
        { id: id(), name: "Suporte de publicação", description: "Apoio em ajustes para lojas e versões", status: "INCLUDED" },
        { id: id(), name: "Relatório mensal", description: "Resumo mensal de incidentes, uso e melhorias sugeridas", status: "INCLUDED" },
      ],
      extraCosts: [
        { id: id(), name: "Publicação emergencial", description: "Build e submissão fora da janela mensal", amount: 220, periodicity: "ONE_TIME", nextDueDate: null, status: "ACTIVE" },
      ],
      payments: [],
      createdAt: daysAgo(20),
      updatedAt: now,
    },
    {
      id: renewalPlanId,
      projectId: renewalProjectId,
      projectName: "Landing Page Assinatura Mensal",
      name: "Plano Mensal Renovável",
      description: "Plano mensal de acompanhamento contínuo para uma landing page em produção, renovado conforme necessidade do cliente.",
      amount: 220,
      billingCycle: "MONTHLY",
      startDate: daysAgo(55),
      endDate: daysFromNow(12),
      status: "ACTIVE",
      includedItems: [
        { id: id(), name: "Suporte mensal", description: "Atendimento para dúvidas e pequenos ajustes", status: "INCLUDED" },
        { id: id(), name: "Monitoramento básico", description: "Acompanhamento de disponibilidade e formulário", status: "INCLUDED" },
      ],
      extraCosts: [
        { id: id(), name: "Nova seção promocional", description: "Criação de uma seção adicional para campanha", amount: 260, periodicity: "ONE_TIME", nextDueDate: null, status: "ACTIVE" },
        { id: id(), name: "Integração com ferramenta externa", description: "Configuração de CRM, automação ou pixel adicional", amount: 180, periodicity: "ONE_TIME", nextDueDate: null, status: "ACTIVE" },
      ],
      payments: [],
      createdAt: daysAgo(55),
      updatedAt: now,
    },
  ];

  const investmentPlans = [
    {
      id: investmentPortalId,
      projectId: primaryProjectId,
      clientId,
      projectName: "Portal Institucional Maiawall",
      name: "Desenvolvimento Portal Institucional",
      description: "Desenvolvimento completo do portal institucional: homepage, blog, serviços, contato, área admin, responsivo, SEO.",
      totalAmount: 15000,
      downPayment: 3000,
      downPaymentDate: daysAgo(50),
      downPaymentStatus: "PAID",
      installments: 12,
      installmentAmount: 1000,
      paidAmount: 8000,
      remainingAmount: 7000,
      paidInstallments: 5,
      remainingInstallments: 7,
      status: "PARTIALLY_PAID",
      paymentMethod: "PIX + Boleto",
      createdAt: daysAgo(50),
      updatedAt: now,
    },
    {
      id: investmentDashboardId,
      projectId: homologProjectId,
      clientId,
      projectName: "Dashboard Operacional",
      name: "Desenvolvimento Dashboard Operacional",
      description: "Dashboard autenticado com gráficos, métricas, relatórios, gestão de usuários e permissões.",
      totalAmount: 12000,
      downPayment: 2000,
      downPaymentDate: daysAgo(15),
      downPaymentStatus: "PAID",
      installments: 10,
      installmentAmount: 1000,
      paidAmount: 2000,
      remainingAmount: 10000,
      paidInstallments: 0,
      remainingInstallments: 10,
      status: "ACTIVE",
      paymentMethod: "Boleto",
      createdAt: daysAgo(15),
      updatedAt: now,
    },
    {
      id: investmentMobileId,
      projectId: mobileProjectId,
      clientId,
      projectName: "App Mobile Cliente",
      name: "Desenvolvimento App Mobile",
      description: "App nativo iOS/Android com React Native: autenticação, lista de projetos, tarefas, chat, push notifications.",
      totalAmount: 25000,
      downPayment: 5000,
      downPaymentDate: daysAgo(100),
      downPaymentStatus: "PAID",
      installments: 8,
      installmentAmount: 2500,
      paidAmount: 25000,
      remainingAmount: 0,
      paidInstallments: 8,
      remainingInstallments: 0,
      status: "PAID",
      paymentMethod: "Transferência",
      createdAt: daysAgo(100),
      updatedAt: daysAgo(30),
    },
  ];

  const planPayments = [
    ...Array.from({ length: 4 }, (_, index) => ({
      id: id(),
      planId: maintenancePlanId,
      number: index + 1,
      amount: 300,
      dueDate: daysAgo(30 - index * 30),
      paidAt: daysAgo(28 - index * 30),
      status: "PAID",
    })),
    {
      id: id(),
      planId: maintenancePlanId,
      number: 5,
      amount: 300,
      dueDate: daysAgo(0),
      paidAt: null,
      status: "PENDING",
    },
    ...Array.from({ length: 3 }, (_, index) => ({
      id: id(),
      planId: supportPlanId,
      number: index + 1,
      amount: 500,
      dueDate: daysAgo(10 - index * 30),
      paidAt: daysAgo(8 - index * 30),
      status: "PAID",
    })),
    ...Array.from({ length: 2 }, (_, index) => ({
      id: id(),
      planId: mobileSupportPlanId,
      number: index + 1,
      amount: 350,
      dueDate: daysAgo(20 - index * 30),
      paidAt: daysAgo(18 - index * 30),
      status: "PAID",
    })),
    {
      id: id(),
      planId: mobileSupportPlanId,
      number: 3,
      amount: 350,
      dueDate: daysFromNow(10),
      paidAt: null,
      status: "PENDING",
    },
    {
      id: id(),
      planId: renewalPlanId,
      number: 1,
      amount: 220,
      dueDate: daysAgo(55),
      paidAt: daysAgo(54),
      status: "PAID",
    },
    {
      id: id(),
      planId: renewalPlanId,
      number: 2,
      amount: 220,
      dueDate: daysAgo(25),
      paidAt: daysAgo(24),
      status: "PAID",
    },
    {
      id: id(),
      planId: renewalPlanId,
      number: 3,
      amount: 220,
      dueDate: daysFromNow(5),
      paidAt: null,
      status: "PENDING",
    },
  ];

  const installments = [
    ...Array.from({ length: 12 }, (_, index) => ({
      id: id(),
      investmentPlanId: investmentPortalId,
      planId: investmentPortalId,
      number: index + 1,
      amount: 1000,
      dueDate: daysAgo(20 - index * 30),
      paidAt: index < 5 ? daysAgo(18 - index * 30) : null,
      status: index < 5 ? "PAID" : "PENDING",
    })),
    ...Array.from({ length: 10 }, (_, index) => ({
      id: id(),
      investmentPlanId: investmentDashboardId,
      planId: investmentDashboardId,
      number: index + 1,
      amount: 1000,
      dueDate: daysFromNow(15 + index * 30),
      paidAt: null,
      status: "PENDING",
    })),
    ...Array.from({ length: 8 }, (_, index) => ({
      id: id(),
      investmentPlanId: investmentMobileId,
      planId: investmentMobileId,
      number: index + 1,
      amount: 2500,
      dueDate: daysAgo(70 - index * 30),
      paidAt: daysAgo(68 - index * 30),
      status: "PAID",
    })),
  ];

  const notifications = [
    {
      id: id(),
      userId: clientId,
      title: "Nova versão disponível",
      message: "A versão v1.4.0 do portal está pronta para revisão.",
      type: "PROJECT",
      read: false,
      createdAt: daysAgo(3),
    },
    {
      id: id(),
      userId: clientId,
      title: "Pendência criada",
      message: "Precisamos dos arquivos de identidade visual para seguir com o portal.",
      type: "PENDING",
      relatedEntityId: null,
      read: false,
      createdAt: daysAgo(2),
    },
    {
      id: id(),
      userId: clientId,
      title: "Pendência criada",
      message: "Confirme os textos finais da página inicial.",
      type: "PENDING",
      relatedEntityId: null,
      read: false,
      createdAt: daysAgo(1),
    },
    {
      id: id(),
      userId: clientId,
      title: "Pagamento de plano próximo",
      message: "O pagamento do Plano de Manutenção Mensal vence em 5 dias.",
      type: "PLAN_PAYMENT",
      relatedEntityId: maintenancePlanId,
      read: false,
      createdAt: daysAgo(0),
    },
    {
      id: id(),
      userId: clientId,
      title: "Renovação de plano necessária",
      message: "Este é o último mês do Plano Mensal Renovável. Ele termina em 12 dias. Entre em contato com o suporte e renove para continuar com os serviços.",
      type: "PLAN_RENEWAL_DUE",
      relatedEntityType: "PLAN",
      relatedEntityId: renewalPlanId,
      priority: "HIGH",
      metadata: {
        planId: renewalPlanId,
        projectId: renewalProjectId,
        projectName: "Landing Page Assinatura Mensal",
        daysUntilEnd: 12,
      },
      read: false,
      createdAt: daysAgo(0),
    },
    {
      id: id(),
      userId: clientId,
      title: "Parcela de investimento vencendo",
      message: "A parcela 6/12 do investimento do Portal Institucional vence em 3 dias.",
      type: "INVESTMENT_PAYMENT",
      relatedEntityId: investmentPortalId,
      read: false,
      createdAt: daysAgo(0),
    },
    {
      id: id(),
      userId: adminId,
      title: "Projeto entrou em homologação",
      message: "O Portal Institucional Maiawall entrou em homologação.",
      type: "PROJECT_ENTERED_HOMOLOGATION",
      relatedEntityId: primaryProjectId,
      read: false,
      createdAt: daysAgo(3),
    },
  ];

  const pending = [
    {
      id: id(),
      clientId,
      projectId: primaryProjectId,
      project: {
        id: primaryProjectId,
        name: "Portal Institucional Maiawall",
        status: "HOMOLOGATION",
      },
      title: "Enviar identidade visual",
      description: "Precisamos dos arquivos de logo, paleta de cores e referências visuais para seguir com a interface.",
      status: "PENDING",
      isRead: false,
      priority: "HIGH",
      dueDate: daysAgo(-7),
      fields: [
        {
          id: id(),
          type: "FILE",
          label: "Logo da empresa",
          description: "Envie a logo oficial em PNG, SVG ou PDF.",
          required: true,
          allowedExtensions: [".png", ".svg", ".pdf"],
          maxSizeMb: 10,
          multiple: false,
          files: [],
        },
        {
          id: id(),
          type: "TEXTAREA",
          label: "Referências visuais",
          description: "Cole links ou descreva estilos que deseja seguir.",
          required: false,
          value: null,
        },
      ],
      responses: [],
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: id(),
      clientId,
      projectId: primaryProjectId,
      project: {
        id: primaryProjectId,
        name: "Portal Institucional Maiawall",
        status: "HOMOLOGATION",
      },
      title: "Confirmar textos da página inicial",
      description: "Revise e envie os textos finais que devem aparecer na primeira dobra do site.",
      status: "PENDING",
      isRead: false,
      priority: "MEDIUM",
      fields: [
        {
          id: id(),
          type: "TEXT",
          label: "Título principal",
          description: "Texto principal da home.",
          required: true,
          value: null,
        },
        {
          id: id(),
          type: "TEXTAREA",
          label: "Descrição curta",
          description: "Resumo abaixo do título principal.",
          required: true,
          value: null,
        },
      ],
      responses: [],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: id(),
      clientId,
      projectId: homologProjectId,
      project: {
        id: homologProjectId,
        name: "Dashboard Operacional",
        status: "DEVELOPMENT",
      },
      title: "Enviar dados de contato",
      description: "Informe os canais oficiais que devem aparecer no projeto.",
      status: "PENDING",
      isRead: true,
      priority: "LOW",
      fields: [
        {
          id: id(),
          type: "EMAIL",
          label: "E-mail comercial",
          description: "E-mail público para contato.",
          required: true,
          value: null,
        },
        {
          id: id(),
          type: "TEXT",
          label: "WhatsApp",
          description: "Número com DDD.",
          required: true,
          value: null,
        },
      ],
      responses: [],
      createdAt: daysAgo(4),
      updatedAt: daysAgo(3),
    },
    {
      id: id(),
      clientId,
      projectId: primaryProjectId,
      project: {
        id: primaryProjectId,
        name: "Portal Institucional Maiawall",
        status: "HOMOLOGATION",
      },
      title: "Aprovar layout final",
      description: "Aprovar o layout final da home antes do deploy em produção.",
      status: "PENDING",
      isRead: false,
      priority: "HIGH",
      dueDate: daysAgo(-2),
      fields: [
        {
          id: id(),
          type: "TEXT",
          label: "Aprovação",
          description: "Confirmar que o layout está aprovado para produção.",
          required: true,
          value: null,
        },
      ],
      responses: [],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ];

  notifications
    .filter((notification) => notification.type === "PENDING")
    .forEach((notification, index) => {
      notification.relatedEntityId = pending[index]?.id || null;
    });

  const data = {
    users,
    projects,
    projectActivities,
    projectReleases,
    projectCommits,
    investmentPlans,
    plans,
    planPayments,
    installments,
    notifications,
    pending,
    clientSettings,
    passwordRecoveryTokens: [],
  };

  for (const collectionName of COLLECTIONS) {
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    if (data[collectionName] && data[collectionName].length > 0) {
      await collection.insertMany(data[collectionName].map(toMongoDocument));
    }
  }

  await db.collection("plans").dropIndex("projectId_1").catch((error) => {
    if (error.codeName !== "IndexNotFound" && error.code !== 27) {
      throw error;
    }
  });

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("projects").createIndex({ clientId: 1 }),
    db.collection("projects").createIndex({ clientId: 1, isPrimary: 1 }),
    db.collection("investmentPlans").createIndex({ clientId: 1 }),
    db.collection("investmentPlans").createIndex({ projectId: 1 }),
    db.collection("plans").createIndex({ clientId: 1 }),
    db.collection("plans").createIndex({ projectId: 1 }, { unique: true }),
    db.collection("plans").createIndex({ status: 1 }),
    db.collection("planPayments").createIndex({ planId: 1 }),
    db.collection("installments").createIndex({ investmentPlanId: 1 }),
    db.collection("notifications").createIndex({ userId: 1 }),
    db.collection("pending").createIndex({ clientId: 1 }),
    db.collection("pending").createIndex({ projectId: 1 }),
    db.collection("pending").createIndex({ clientId: 1, status: 1 }),
    db.collection("clientSettings").createIndex({ clientId: 1 }, { unique: true }),
    db.collection("passwordRecoveryTokens").createIndex({ email: 1 }),
    db.collection("passwordRecoveryTokens").createIndex({ tokenHash: 1 }, { unique: true }),
  ]);

  console.log("Seed Maiawall Homolog concluído.");
  console.log("ADMIN   admin@maiawall.com   Admin@123");
  console.log("CLIENT  cliente@maiawall.com Cliente@123");
  console.log(`PENDÊNCIAS: ${pending.length} registros criados para o cliente.`);
  console.log(`INVESTIMENTOS: ${investmentPlans.length} planos de investimento criados.`);
  console.log(`PLANOS DE SERVIÇO: ${plans.length} planos de serviços recorrentes criados.`);
  console.log(`PARCELAS DE PLANOS: ${planPayments.length} pagamentos de planos criados.`);
  console.log(`PARCELAS DE INVESTIMENTOS: ${installments.length} parcelas de investimento criadas.`);
}

function assertSeedAllowed() {
  const environment = getEnvironment();
  const databaseName = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || "maiawall_homolog";

  if (isLocalEnvironment()) return;

  const expectedConfirmation = `SEED ${databaseName}`;
  if (process.env.CONFIRM_SEED !== expectedConfirmation) {
    throw new Error(
      `Seed bloqueado para APP_ENV=${environment}. Defina CONFIRM_SEED="${expectedConfirmation}" para confirmar a limpeza das coleções.`,
    );
  }
}

function getEnvironment() {
  return (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase();
}

function isLocalEnvironment() {
  return ["local", "development", "dev", "test"].includes(getEnvironment());
}

function toMongoDocument(document) {
  const { id: documentId, ...rest } = document;
  return {
    _id: new ObjectId(documentId),
    ...rest,
  };
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongoConnection();
  });
