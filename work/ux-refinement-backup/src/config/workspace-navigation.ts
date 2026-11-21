export interface NavItemConfig {
  id: string;
  labelEn: string;
  labelAr: string;
  href: string;
  iconName: string;
  exact?: boolean;
}

export interface WorkspaceConfig {
  id: string;
  titleEn: string;
  titleAr: string;
  defaultRoute: string;
  allowedRoles: string[];
  navItems: NavItemConfig[];
}

export const WORKSPACE_CONFIGS: Record<string, WorkspaceConfig> = {
  PATIENT: {
    id: 'PATIENT',
    titleEn: 'Patient Health Portal',
    titleAr: 'بوابة المريض الصحية',
    defaultRoute: '/portal',
    allowedRoles: ['PATIENT', 'OWNER_ADMIN'],
    navItems: [
      { id: 'home', labelEn: 'Home', labelAr: 'الرئيسية', href: '/portal', iconName: 'LayoutDashboard', exact: true },
      { id: 'appointments', labelEn: 'Appointments', labelAr: 'المواعيد', href: '/portal/appointments', iconName: 'Calendar' },
      { id: 'my-care', labelEn: 'My Care & Intake', labelAr: 'خطة علاجي والتاريخ الطبي', href: '/portal/intake', iconName: 'HeartPulse' },
      { id: 'payments', labelEn: 'Payments & Invoices', labelAr: 'الفواتير والمدفوعات', href: '/portal/billing', iconName: 'CreditCard' },
      { id: 'profile', labelEn: 'Profile & Support', labelAr: 'ملفي والدعم', href: '/portal/feedback', iconName: 'User' },
    ],
  },
  RECEPTIONIST: {
    id: 'RECEPTIONIST',
    titleEn: 'Receptionist / Front Desk',
    titleAr: 'مكتب الاستقبال',
    defaultRoute: '/reception',
    allowedRoles: ['RECEPTIONIST', 'BRANCH_MANAGER', 'OWNER_ADMIN'],
    navItems: [
      { id: 'today', labelEn: 'Today & Queue', labelAr: 'الانتظار والحضور اليومي', href: '/reception', iconName: 'Clock', exact: true },
      { id: 'appointments', labelEn: 'Appointments Calendar', labelAr: 'تقويم المواعيد', href: '/reception/agenda', iconName: 'Calendar' },
      { id: 'patients', labelEn: 'Patients & Registration', labelAr: 'المرضى والتسجيل', href: '/reception?view=patients', iconName: 'Users' },
      { id: 'checkout', labelEn: 'Checkout & Receipts', labelAr: 'تحصيل الدفعات', href: '/billing?mode=checkout', iconName: 'CreditCard' },
    ],
  },
  DENTIST: {
    id: 'DENTIST',
    titleEn: 'Dentist / Clinical Workspace',
    titleAr: 'مساحة الطبيب السريرية',
    defaultRoute: '/dentist',
    allowedRoles: ['DENTIST', 'OWNER_ADMIN'],
    navItems: [
      { id: 'my-day', labelEn: 'My Day', labelAr: 'مرضى اليوم', href: '/dentist', iconName: 'Stethoscope', exact: true },
      { id: 'schedule', labelEn: 'Schedule & Duties', labelAr: 'جدول المواعيد', href: '/dentist?view=schedule', iconName: 'Calendar' },
      { id: 'patient-charts', labelEn: 'Patient Charts', labelAr: 'مخطط الأسنان والملفات', href: '/dentist?view=charts', iconName: 'FileText' },
      { id: 'clinical-tasks', labelEn: 'Clinical Tasks & Recalls', labelAr: 'المراجعات والمتابعة', href: '/dentist?view=tasks', iconName: 'ClipboardCheck' },
    ],
  },
  OWNER: {
    id: 'OWNER',
    titleEn: 'Owner / Executive Management',
    titleAr: 'الإدارة التنفيذية والفروع',
    defaultRoute: '/management',
    allowedRoles: ['OWNER_ADMIN', 'BRANCH_MANAGER'],
    navItems: [
      { id: 'overview', labelEn: 'Overview', labelAr: 'نظرة تنفيذية شاملة', href: '/management', iconName: 'LayoutDashboard', exact: true },
      { id: 'branches', labelEn: 'Branches Comparison', labelAr: 'مقارنة وتفاصيل الفروع', href: '/management?view=branches', iconName: 'Building2' },
      { id: 'finance', labelEn: 'Finance Summary', labelAr: 'الملخص المالي', href: '/billing', iconName: 'CreditCard' },
      { id: 'operations', labelEn: 'Operations & Alerts', labelAr: 'الرقابة والتنبيهات', href: '/management?view=issues', iconName: 'Boxes' },
      { id: 'reports', labelEn: 'Reports & CRM', labelAr: 'التقارير وعلاقات المرضى', href: '/crm', iconName: 'BarChart3' },
    ],
  },
  FINANCE: {
    id: 'FINANCE',
    titleEn: 'Finance & Accounting',
    titleAr: 'المالية والحسابات',
    defaultRoute: '/billing',
    allowedRoles: ['BRANCH_MANAGER', 'OWNER_ADMIN', 'RECEPTIONIST'],
    navItems: [
      { id: 'billing', labelEn: 'Invoices', labelAr: 'الفواتير', href: '/billing', iconName: 'Receipt', exact: true },
      { id: 'payments', labelEn: 'Payment Recording', labelAr: 'تحصيل المدفوعات', href: '/billing?view=payments', iconName: 'CreditCard' },
      { id: 'balances', labelEn: 'Balances & Installments', labelAr: 'الأرصدة والأقساط', href: '/billing?view=balances', iconName: 'FileText' },
      { id: 'reconciliation', labelEn: 'Cash Reconciliation', labelAr: 'تسوية الخزينة', href: '/billing?view=reconciliation', iconName: 'ShieldCheck' },
      { id: 'reports', labelEn: 'Expenses & Finance Reports', labelAr: 'المصروفات والتقارير المالية', href: '/billing?view=expenses', iconName: 'BarChart3' },
    ],
  },
  INVENTORY: {
    id: 'INVENTORY',
    titleEn: 'Inventory & Procurement',
    titleAr: 'المخزون والمشتريات',
    defaultRoute: '/inventory',
    allowedRoles: ['BRANCH_MANAGER', 'OWNER_ADMIN'],
    navItems: [
      { id: 'stock', labelEn: 'Branch Stock Balances', labelAr: 'أرصدة المخزون بالفروع', href: '/inventory', iconName: 'Boxes', exact: true },
      { id: 'stock-movements', labelEn: 'Branch-to-Branch Transfers', labelAr: 'التحويلات بين الفروع', href: '/inventory?view=movements', iconName: 'Truck' },
      { id: 'replenishment', labelEn: 'Purchase Orders & Receipts', labelAr: 'أوامر الشراء والاستلام', href: '/inventory?view=replenishment', iconName: 'ShoppingCart' },
      { id: 'procurement-desk', labelEn: 'Suppliers & Requests', labelAr: 'الموردون وطلبات الشراء', href: '/purchasing', iconName: 'Building2' },
    ],
  },
  CRM: {
    id: 'CRM',
    titleEn: 'Marketing, CRM & Retention',
    titleAr: 'التسويق وعلاقات المرضى',
    defaultRoute: '/crm',
    allowedRoles: ['OWNER_ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST'],
    navItems: [
      { id: 'inquiries', labelEn: 'Inquiries & Lead Pipeline', labelAr: 'الاستفسارات والعملاء المحتملون', href: '/crm', iconName: 'Users', exact: true },
      { id: 'retention', labelEn: 'Patient Recall & Follow-Ups', labelAr: 'الاستدعاء ومتابعة المرضى', href: '/crm?view=retention', iconName: 'Clock' },
      { id: 'analytics', labelEn: 'Conversion & Attribution', labelAr: 'تحليلات التحويل والحملات', href: '/crm?view=analytics', iconName: 'BarChart3' },
      { id: 'feedback', labelEn: 'Feedback & Reviews', labelAr: 'آراء المرضى والشكاوى', href: '/crm?view=feedback', iconName: 'ClipboardCheck' },
    ],
  },
  ADMIN: {
    id: 'ADMIN',
    titleEn: 'Super Admin / Configuration',
    titleAr: 'إدارة النظام والإعدادات',
    defaultRoute: '/admin',
    allowedRoles: ['OWNER_ADMIN'],
    navItems: [
      { id: 'audit-system', labelEn: 'Audit & Security Logs', labelAr: 'سجل التدقيق والأمان', href: '/admin', iconName: 'ShieldCheck', exact: true },
      { id: 'users-roles', labelEn: 'User Accounts & Roles', labelAr: 'المستخدمون والصلاحيات', href: '/admin?view=users', iconName: 'Users' },
      { id: 'branch-settings', labelEn: 'Branch & Doctor Config', labelAr: 'إعدادات الفروع والأطباء', href: '/admin?view=branches', iconName: 'Building2' },
      { id: 'services-pricing', labelEn: 'Pricing & Integrations', labelAr: 'الأسعار والتكاملات', href: '/admin?view=services', iconName: 'Settings' },
    ],
  },
};

export function resolveActiveWorkspace(
  pathname: string,
  primaryRole?: string | null
): WorkspaceConfig {
  if (pathname.startsWith('/portal')) {
    return WORKSPACE_CONFIGS.PATIENT;
  }
  if (pathname.startsWith('/reception')) {
    return WORKSPACE_CONFIGS.RECEPTIONIST;
  }
  if (pathname.startsWith('/dentist')) {
    return WORKSPACE_CONFIGS.DENTIST;
  }
  if (pathname.startsWith('/inventory') || pathname.startsWith('/purchasing') || pathname.startsWith('/operations')) {
    return WORKSPACE_CONFIGS.INVENTORY;
  }
  if (pathname.startsWith('/crm')) {
    return WORKSPACE_CONFIGS.CRM;
  }
  if (pathname.startsWith('/admin')) {
    return WORKSPACE_CONFIGS.ADMIN;
  }
  if (pathname.startsWith('/billing')) {
    if (primaryRole === 'RECEPTIONIST') {
      return WORKSPACE_CONFIGS.RECEPTIONIST;
    }
    return WORKSPACE_CONFIGS.FINANCE;
  }
  if (pathname.startsWith('/management')) {
    return WORKSPACE_CONFIGS.OWNER;
  }

  switch (primaryRole) {
    case 'PATIENT':
      return WORKSPACE_CONFIGS.PATIENT;
    case 'RECEPTIONIST':
      return WORKSPACE_CONFIGS.RECEPTIONIST;
    case 'DENTIST':
      return WORKSPACE_CONFIGS.DENTIST;
    case 'BRANCH_MANAGER':
      return WORKSPACE_CONFIGS.OWNER;
    default:
      return WORKSPACE_CONFIGS.OWNER;
  }
}

export function getAuthorizedWorkspacesForRole(primaryRole?: string | null): WorkspaceConfig[] {
  if (primaryRole === 'OWNER_ADMIN') {
    return [
      WORKSPACE_CONFIGS.OWNER,
      WORKSPACE_CONFIGS.RECEPTIONIST,
      WORKSPACE_CONFIGS.DENTIST,
      WORKSPACE_CONFIGS.FINANCE,
      WORKSPACE_CONFIGS.INVENTORY,
      WORKSPACE_CONFIGS.CRM,
      WORKSPACE_CONFIGS.ADMIN,
    ];
  }
  if (primaryRole === 'BRANCH_MANAGER') {
    return [
      WORKSPACE_CONFIGS.OWNER,
      WORKSPACE_CONFIGS.FINANCE,
      WORKSPACE_CONFIGS.INVENTORY,
      WORKSPACE_CONFIGS.CRM,
      WORKSPACE_CONFIGS.RECEPTIONIST,
    ];
  }
  if (primaryRole === 'RECEPTIONIST') {
    return [WORKSPACE_CONFIGS.RECEPTIONIST];
  }
  if (primaryRole === 'DENTIST') {
    return [WORKSPACE_CONFIGS.DENTIST];
  }
  if (primaryRole === 'PATIENT') {
    return [WORKSPACE_CONFIGS.PATIENT];
  }
  return [];
}
