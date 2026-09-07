/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PERMISSION_CATALOG, RESOURCES } from '../src/common/permissions/permission-catalog';
import type { FieldDefinition } from '../src/common/form-schema/form-schema.types';

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = 'faizullahk35@gmail.com';
const SUPER_ADMIN_PASSWORD = 'ChangeMe!12345';

// ---------------------------------------------------------------------------
// Role -> permission-catalog-key mapping. Keys are "RESOURCE:ACTION" strings
// checked against PERMISSION_CATALOG below. This is only the *seeded default*;
// Super Admin can freely re-configure role->permission assignments afterwards.
// ---------------------------------------------------------------------------
const ROLE_DEFINITIONS: { name: string; description: string; isSystem: boolean; permissions: string[] }[] = [
  {
    name: 'Super Admin',
    description: 'Full control over every module, user, and setting.',
    isSystem: true,
    permissions: PERMISSION_CATALOG.map((p) => `${p.resource}:${p.action}`),
  },
  {
    name: 'Program Manager',
    description: 'Publishes funding calls and oversees applications, projects, and report templates.',
    isSystem: false,
    permissions: [
      'PROGRAM:VIEW', 'PROGRAM:CREATE', 'PROGRAM:EDIT', 'PROGRAM:DELETE',
      'APPLICATION:VIEW', 'APPLICATION:EDIT', 'APPLICATION:APPROVE', 'APPLICATION:REJECT', 'APPLICATION:REQUEST_CORRECTION',
      'PROJECT:VIEW', 'PROJECT:EDIT',
      'REPORT_TEMPLATE:VIEW', 'REPORT_TEMPLATE:CREATE', 'REPORT_TEMPLATE:EDIT',
      'REPORT:VIEW', 'REPORT:COMMUNICATE',
      'APPLICANT_CATEGORY:VIEW',
      'ATTACHMENT:VIEW', 'ATTACHMENT:DOWNLOAD',
    ],
  },
  {
    name: 'Project Officer',
    description: 'Processes applications, issues award letters, and manages project records day-to-day.',
    isSystem: false,
    permissions: [
      'APPLICATION:VIEW', 'APPLICATION:EDIT', 'APPLICATION:APPROVE', 'APPLICATION:REJECT', 'APPLICATION:REQUEST_CORRECTION',
      'PROJECT:VIEW', 'PROJECT:EDIT',
      'ATTACHMENT:VIEW', 'ATTACHMENT:CREATE', 'ATTACHMENT:DOWNLOAD',
      'REPORT:VIEW', 'REPORT:COMMUNICATE',
      'VERIFICATION:CREATE',
    ],
  },
  {
    name: 'Finance Officer',
    description: 'Reviews financial reports, tracks disbursement and utilization.',
    isSystem: false,
    permissions: [
      'PROJECT:VIEW',
      'REPORT:VIEW', 'REPORT:APPROVE', 'REPORT:REJECT', 'REPORT:REQUEST_CORRECTION', 'REPORT:COMMUNICATE', 'REPORT:EXPORT',
      'ATTACHMENT:VIEW', 'ATTACHMENT:DOWNLOAD',
    ],
  },
  {
    name: 'Communication Manager',
    description: 'Handles correspondence with applicants about documents, deadlines, and progress.',
    isSystem: false,
    permissions: ['REPORT:VIEW', 'REPORT:COMMUNICATE', 'USER:VIEW', 'PROJECT:VIEW'],
  },
  {
    name: 'Technical Reviewer',
    description: 'Reviews technical/progress reports and deliverables for scientific merit.',
    isSystem: false,
    permissions: [
      'REPORT:VIEW', 'REPORT:APPROVE', 'REPORT:REJECT', 'REPORT:REQUEST_CORRECTION', 'REPORT:COMMUNICATE', 'REPORT:EXPORT',
      'PROJECT:VIEW', 'ATTACHMENT:VIEW', 'ATTACHMENT:DOWNLOAD',
    ],
  },
  {
    name: 'Document Verification Officer',
    description: 'Verifies uploaded documents, legal paperwork, and award letters for authenticity.',
    isSystem: false,
    permissions: ['ATTACHMENT:VIEW', 'ATTACHMENT:VERIFY', 'ATTACHMENT:DOWNLOAD', 'PROJECT:VIEW', 'PROJECT:VERIFY', 'VERIFICATION:VIEW', 'VERIFICATION:VERIFY'],
  },
  {
    name: 'Monitoring Officer',
    description: 'Tracks project progress and milestones across the portfolio.',
    isSystem: false,
    permissions: [
      'PROJECT:VIEW', 'PROJECT:EDIT',
      'REPORT:VIEW', 'REPORT:APPROVE', 'REPORT:REJECT', 'REPORT:REQUEST_CORRECTION', 'REPORT:COMMUNICATE',
    ],
  },
  {
    name: 'Auditor',
    description: 'Read-only oversight of audit trails, financials, and reports for compliance.',
    isSystem: false,
    permissions: ['AUDIT_LOG:VIEW', 'AUDIT_LOG:EXPORT', 'REPORT:VIEW', 'PROJECT:VIEW', 'ATTACHMENT:VIEW'],
  },
  {
    name: 'Applicant',
    description: 'Student / researcher / faculty / institution / startup submitting and managing their own project.',
    isSystem: true,
    permissions: [],
  },
];

const APPLICANT_CATEGORIES: { code: string; name: string; description: string; profileFieldSchema: FieldDefinition[] }[] = [
  {
    code: 'STUDENT',
    name: 'Student',
    description: 'Undergraduate/postgraduate student applying for a research support grant (e.g. Final Year Project).',
    profileFieldSchema: [
      { key: 'registrationNumber', label: 'Registration / Roll Number', type: 'text', required: true },
      { key: 'degreeProgram', label: 'Degree Program', type: 'text', required: true },
      { key: 'supervisorName', label: 'Supervisor Name', type: 'text', required: true },
      { key: 'supervisorEmail', label: 'Supervisor Email', type: 'text', required: false },
      { key: 'expectedGraduationYear', label: 'Expected Graduation Year', type: 'number', required: false },
    ],
  },
  {
    code: 'RESEARCHER',
    name: 'Researcher',
    description: 'Independent or institutionally-affiliated researcher.',
    profileFieldSchema: [
      { key: 'cnic', label: 'CNIC', type: 'text', required: true },
      { key: 'highestQualification', label: 'Highest Qualification', type: 'text', required: true },
      { key: 'researchArea', label: 'Primary Research Area', type: 'text', required: false },
    ],
  },
  {
    code: 'FACULTY',
    name: 'Faculty',
    description: 'Faculty member at a university/institution acting as Principal Investigator.',
    profileFieldSchema: [
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'employeeId', label: 'Employee / IRTC No.', type: 'text', required: false },
      { key: 'yearsOfExperience', label: 'Years of Research Experience', type: 'number', required: false },
    ],
  },
  {
    code: 'UNIVERSITY',
    name: 'University / Institution',
    description: 'A university or research institution applying on behalf of a project team.',
    profileFieldSchema: [
      { key: 'registrationAuthority', label: 'Registered With (e.g. HEC)', type: 'text', required: false },
      { key: 'contactPersonName', label: 'Focal Person Name', type: 'text', required: true },
      { key: 'contactPersonDesignation', label: 'Focal Person Designation', type: 'text', required: false },
    ],
  },
  {
    code: 'STARTUP',
    name: 'Startup / Company',
    description: 'A registered startup or company applying for patent/prototyping or commercialization support.',
    profileFieldSchema: [
      { key: 'registrationNumber', label: 'Company Registration Number', type: 'text', required: true },
      { key: 'businessSector', label: 'Business Sector', type: 'text', required: false },
      { key: 'yearEstablished', label: 'Year Established', type: 'number', required: false },
    ],
  },
  {
    code: 'OTHER',
    name: 'Other',
    description: 'Any other Directorate-recognized applicant category not listed above.',
    profileFieldSchema: [{ key: 'categoryNote', label: 'Please specify', type: 'text', required: true }],
  },
];

// ---------------------------------------------------------------------------
// Report template field schemas, transcribed from the official Directorate
// formats under /Reports_Format (UGRS = Undergraduate Research Support Program,
// PPS = Patent and Prototyping Support). See /docs/ARCHITECTURE.md for how this
// maps back to the source .docx files.
// ---------------------------------------------------------------------------

const activityTableColumns: FieldDefinition[] = [
  { key: 'activityName', label: 'Activity Name', type: 'text', required: true },
  { key: 'activityDescription', label: 'Activity Description', type: 'textarea' },
  { key: 'startDate', label: 'Starting Date', type: 'date' },
  { key: 'completionDate', label: 'Date of Completion', type: 'date' },
  { key: 'milestone', label: 'Milestone', type: 'text' },
  {
    key: 'achieved',
    label: 'Achieved',
    type: 'select',
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
    ],
  },
];

const ganttMonthColumns: FieldDefinition[] = [
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may', 'jun',
].map((m) => ({ key: m, label: m[0].toUpperCase() + m.slice(1), type: 'checkbox' as const }));

function physicalProgressSchema(opts: { advisorLabel: string; scholarLabel: string }): FieldDefinition[] {
  return [
    {
      key: 'personalInformation', label: 'Personal Information of Awardee', type: 'section', fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'departmentCentre', label: 'Department / Centre', type: 'text', required: true },
        { key: 'university', label: 'University', type: 'text', required: true },
        { key: 'advisorName', label: `${opts.advisorLabel} - Name`, type: 'text', required: true },
        { key: 'advisorContact', label: `${opts.advisorLabel} - Email / Mobile No.`, type: 'text' },
        { key: 'scholarContact', label: `${opts.scholarLabel} - Email / Mobile No.`, type: 'text' },
      ],
    },
    {
      key: 'projectDetails', label: 'Project Details', type: 'section', fields: [
        { key: 'onGoingResearch', label: 'On-going Research', type: 'radio', options: [{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }] },
        { key: 'startingDate', label: 'Starting Date of Research Project', type: 'month', required: true },
        { key: 'expectedCompletionDate', label: 'Date / Expected Date of Completion', type: 'month', required: true },
      ],
    },
    { key: 'reportPeriodStart', label: 'Reporting Quarter - Start Date', type: 'date', required: true },
    { key: 'reportPeriodEnd', label: 'Reporting Quarter - End Date', type: 'date', required: true },
    {
      key: 'activitiesCompleted', label: 'Activity Completed in Quarter', type: 'table',
      columns: activityTableColumns, minRows: 1, maxRows: 6, defaultRows: 1,
    },
    {
      key: 'activitiesPlanned', label: 'Activity Plan of Next Quarter', type: 'table',
      columns: activityTableColumns, minRows: 0, maxRows: 8, defaultRows: 1,
    },
    {
      key: 'ganttChart', label: 'Gantt Chart of the Research Plan (One Year Plan)', type: 'table',
      columns: [{ key: 'activityName', label: 'Activity Name', type: 'text', required: true }, ...ganttMonthColumns],
      minRows: 0, maxRows: 12, defaultRows: 1,
    },
    { key: 'remarksOfSupervisor', label: `Remarks of ${opts.advisorLabel}`, type: 'textarea' },
    {
      key: 'verification', label: 'Verified / Certified By', type: 'section', fields: [
        { key: 'reviewerName', label: `${opts.advisorLabel} - Name`, type: 'text', required: true },
        { key: 'reviewerDesignation', label: 'Designation / IRTC No.', type: 'text' },
        { key: 'reviewerSignatureDate', label: 'Signature Date', type: 'date' },
        { key: 'hodName', label: 'Head of Department - Name', type: 'text', required: true },
        { key: 'hodSignatureDate', label: 'Countersigned Date', type: 'date' },
      ],
    },
  ];
}

const financialFundsTableColumns: FieldDefinition[] = [
  { key: 'description', label: 'Description', type: 'text', required: true },
  { key: 'totalFundsReleased', label: 'Total Funds Released (PKR)', type: 'number', required: true, min: 0 },
  { key: 'expenditure', label: 'Expenditure (PKR)', type: 'number', required: true, min: 0 },
  { key: 'balanceAvailable', label: 'Balance Available (PKR)', type: 'number', required: true, min: 0 },
];

function financialReportSchema(): FieldDefinition[] {
  return [
    { key: 'reportPeriodStart', label: 'Reporting Period - Start Date', type: 'date', required: true },
    { key: 'reportPeriodEnd', label: 'Reporting Period - End Date', type: 'date', required: true },
    {
      key: 'scholarInformation', label: 'Personal Information of Scholar / Awardee / Researcher', type: 'section', fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'departmentCentre', label: 'Department / Centre', type: 'text', required: true },
        { key: 'university', label: 'University', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'treasurerEmail', label: 'Treasurer / Director Finance Email', type: 'text' },
      ],
    },
    {
      key: 'fundsUtilization', label: 'Funds Utilization Status (Amount in PKR)', type: 'table',
      columns: financialFundsTableColumns, minRows: 1, maxRows: 6, defaultRows: 1,
    },
    { key: 'amountReceived', label: 'Amount Received (PKR)', type: 'number', required: true, min: 0 },
    { key: 'amountUtilized', label: 'Amount Utilized (PKR)', type: 'number', required: true, min: 0 },
    {
      key: 'certification', label: 'Certification', type: 'section', fields: [
        { key: 'supervisorName', label: 'Supervisor / Principal Investigator - Name', type: 'text', required: true },
        { key: 'supervisorSignatureDate', label: 'Signature Date', type: 'date' },
        { key: 'financeDirectorName', label: 'Director Finance - Name', type: 'text' },
        { key: 'financeDirectorSignatureDate', label: 'Signature Date', type: 'date' },
        { key: 'auditorName', label: 'Auditor - Name', type: 'text' },
        { key: 'auditorSignatureDate', label: 'Signature Date', type: 'date' },
      ],
    },
  ];
}

const deliverablesChecklistItems = [
  'Research Report / Thesis (hard bound, with DGST logo and acknowledgement)',
  'Prototype (if applicable)',
  'Conference / Journal Paper (with DGST acknowledgement)',
  'Closing Report (Final - Physical and Financial)',
  'Poster (2x5 ft, in color)',
  'Data Sets (in thesis)',
  'Infographics (in thesis)',
  'Videography (short video: student and PI on the grant\'s impact)',
];

function deliverablesSchema(): FieldDefinition[] {
  return [
    {
      key: 'deliverables', label: 'Deliverables Checklist', type: 'table',
      columns: [
        { key: 'submitted', label: 'Submitted', type: 'checkbox' },
        { key: 'remarks', label: 'Remarks', type: 'text' },
      ],
      minRows: deliverablesChecklistItems.length,
      maxRows: deliverablesChecklistItems.length,
      defaultRows: deliverablesChecklistItems.length,
    },
    {
      key: 'studentDetails', label: 'Student Details', type: 'section', fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'projectTitle', label: 'Project Title', type: 'text', required: true },
        { key: 'department', label: 'Department', type: 'text', required: true },
        { key: 'university', label: 'University', type: 'text', required: true },
        { key: 'supervisorName', label: 'Supervisor Name', type: 'text', required: true },
        { key: 'supervisorSignatureDate', label: 'Supervisor Signature Date', type: 'date' },
        { key: 'directorOricName', label: 'Director ORIC - Name', type: 'text' },
        { key: 'submissionDate', label: 'Submission Date', type: 'date', required: true },
      ],
    },
  ];
}

async function main() {
  console.log('Seeding permission catalog...');
  const permissionByKey = new Map<string, string>();
  for (const entry of PERMISSION_CATALOG) {
    const permission = await prisma.permission.upsert({
      where: { resource_action: { resource: entry.resource, action: entry.action } },
      create: { resource: entry.resource, action: entry.action, label: entry.label },
      update: { label: entry.label },
    });
    permissionByKey.set(`${entry.resource}:${entry.action}`, permission.id);
  }

  console.log('Seeding roles...');
  for (const roleDef of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      create: { name: roleDef.name, description: roleDef.description, isSystem: roleDef.isSystem },
      update: { description: roleDef.description },
    });

    const permissionIds = roleDef.permissions.map((key) => permissionByKey.get(key)).filter((id): id is string => Boolean(id));
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }

  console.log('Seeding Super Admin user...');
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Super Admin' } });
  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    create: {
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      fullName: 'DGST Super Administrator',
      isSuperAdmin: true,
      roles: { create: { roleId: superAdminRole.id } },
    },
    update: { isSuperAdmin: true },
  });
  console.log(`Super Admin ready: ${superAdmin.email} / ${SUPER_ADMIN_PASSWORD} (change this password after first login)`);

  console.log('Seeding applicant categories...');
  for (const cat of APPLICANT_CATEGORIES) {
    await prisma.applicantCategory.upsert({
      where: { code: cat.code },
      create: { code: cat.code, name: cat.name, description: cat.description, profileFieldSchema: cat.profileFieldSchema as any },
      update: { name: cat.name, description: cat.description, profileFieldSchema: cat.profileFieldSchema as any },
    });
  }

  console.log('Seeding UGRS and PPS programs...');
  const ugrs = await prisma.program.upsert({
    where: { code: 'UGRS' },
    create: {
      code: 'UGRS',
      title: 'Undergraduate Research Support Program (FYP Student Research Grant)',
      description:
        'Supports undergraduate Final Year Project (FYP) research by students, under faculty supervision, with quarterly ' +
        'physical & financial progress reporting and a final deliverables submission on project closure.',
      status: 'PUBLISHED',
      applicationOpenAt: new Date(),
      applicationDeadline: new Date(new Date().getFullYear() + 1, 5, 30),
      fundingCategories: {
        create: [{ name: 'Standard FYP Research Grant', minAmount: 50000, maxAmount: 300000 }],
      },
      requiredDocumentTypes: {
        create: [
          { name: 'CNIC / Student ID', mandatory: true },
          { name: 'Research Proposal', mandatory: true },
          { name: 'Supervisor Endorsement Letter', mandatory: true },
        ],
      },
      eligibilityCriteria: {
        create: [
          { description: 'Must be a registered undergraduate student at a recognized university.' },
          { description: 'Final Year Project must be supervised by a faculty member.' },
          { description: 'Full eligibility criteria to be finalized from the official UGRS program guidelines.' },
        ],
      },
    },
    update: {},
  });

  const pps = await prisma.program.upsert({
    where: { code: 'PPS' },
    create: {
      code: 'PPS',
      title: 'Patent and Prototyping Support Program',
      description:
        'Supports researchers and innovators in patenting and prototyping novel technologies, with quarterly physical & ' +
        'financial progress reporting to the Directorate.',
      status: 'PUBLISHED',
      applicationOpenAt: new Date(),
      applicationDeadline: new Date(new Date().getFullYear() + 1, 5, 30),
      fundingCategories: {
        create: [{ name: 'Standard Patent & Prototyping Grant', minAmount: 100000, maxAmount: 1000000 }],
      },
      requiredDocumentTypes: {
        create: [
          { name: 'CNIC', mandatory: true },
          { name: 'Invention Disclosure / Research Summary', mandatory: true },
          { name: 'Institutional Endorsement (if applicable)', mandatory: false },
        ],
      },
      eligibilityCriteria: {
        create: [
          { description: 'Applicant must demonstrate a novel, patentable, or prototypeable innovation.' },
          { description: 'Full eligibility criteria to be finalized from the official PPS program guidelines.' },
        ],
      },
    },
    update: {},
  });

  console.log('Seeding report templates from official Directorate formats...');

  await prisma.reportTemplate.upsert({
    where: { code: 'UGRS_PHYSICAL_PROGRESS' },
    create: {
      programId: ugrs.id,
      code: 'UGRS_PHYSICAL_PROGRESS',
      name: 'Physical Progress Report (UGRS)',
      category: 'PROGRESS',
      periodicity: 'QUARTERLY',
      instructions:
        'Transcribed from the official "Physical Progress Report - Undergraduate Research Support Program" format. ' +
        'Submit once per quarter, verified by the IRTC Supervisor and countersigned by the Head of Department.',
      fieldSchema: physicalProgressSchema({ advisorLabel: 'Senior Advisor / IRTC Supervisor', scholarLabel: 'Scholar / Awardee' }) as any,
    },
    update: {},
  });

  await prisma.reportTemplate.upsert({
    where: { code: 'UGRS_FINANCIAL_REPORT' },
    create: {
      programId: ugrs.id,
      code: 'UGRS_FINANCIAL_REPORT',
      name: 'Financial Report (UGRS)',
      category: 'FINANCIAL',
      periodicity: 'QUARTERLY',
      instructions:
        'Transcribed from the official "Financial Report - Undergraduate Research Support Program" format. Submitted ' +
        'quarterly alongside the Physical Progress Report; reviewed by Director Finance and the Auditor before each release.',
      fieldSchema: financialReportSchema() as any,
    },
    update: {},
  });

  await prisma.reportTemplate.upsert({
    where: { code: 'UGRS_DELIVERABLES_PROFORMA' },
    create: {
      programId: ugrs.id,
      code: 'UGRS_DELIVERABLES_PROFORMA',
      name: 'Deliverables Submission Proforma (UGRS)',
      category: 'DELIVERABLES',
      periodicity: 'ONCE',
      instructions:
        'Transcribed from the official "Deliverables Submission Proforma" - submitted once, on completion of the ' +
        'undergraduate research program, verified by the supervisor prior to submission.',
      fieldSchema: deliverablesSchema() as any,
    },
    update: {},
  });

  await prisma.reportTemplate.upsert({
    where: { code: 'PPS_PHYSICAL_PROGRESS' },
    create: {
      programId: pps.id,
      code: 'PPS_PHYSICAL_PROGRESS',
      name: 'Physical Progress Report (Patent & Prototyping)',
      category: 'PROGRESS',
      periodicity: 'QUARTERLY',
      instructions:
        'Transcribed from the official "Physical Progress Report - Patent and Prototyping Support" format. Verified by ' +
        'the Principal Investigator and countersigned by the Head of Department.',
      fieldSchema: physicalProgressSchema({ advisorLabel: 'Principal Investigator', scholarLabel: 'Awardee' }) as any,
    },
    update: {},
  });

  await prisma.reportTemplate.upsert({
    where: { code: 'PPS_FINANCIAL_REPORT' },
    create: {
      programId: pps.id,
      code: 'PPS_FINANCIAL_REPORT',
      name: 'Financial Report (Patent & Prototyping)',
      category: 'FINANCIAL',
      periodicity: 'QUARTERLY',
      instructions:
        'Transcribed from the official "Financial Report - Patent and Prototyping Support" format. Reviewed by Director ' +
        'Finance and the Auditor before each release.',
      fieldSchema: financialReportSchema() as any,
    },
    update: {},
  });

  console.log('Seeding a placeholder legal/stamp-paper document template...');
  await prisma.legalDocumentTemplate.upsert({
    where: { code: 'STAMP_PAPER_GENERIC' },
    create: {
      code: 'STAMP_PAPER_GENERIC',
      name: 'Grant Agreement Stamp Paper (placeholder)',
      instructionsHtml:
        '<p><strong>Placeholder format.</strong> The Directorate has not yet supplied the official stamp-paper/e-stamp ' +
        'template. Once provided, replace this template\'s instructions, downloadable format, and fields below - no ' +
        'code changes required.</p>',
      fieldSchema: [
        { key: 'awardeeName', label: 'Awardee Full Name', type: 'text', required: true },
        { key: 'cnic', label: 'CNIC', type: 'text', required: true },
        { key: 'projectTitle', label: 'Project Title', type: 'text', required: true },
        { key: 'grantAmount', label: 'Grant Amount (PKR)', type: 'number', required: true },
        { key: 'executionDate', label: 'Execution Date', type: 'date', required: true },
      ] as any,
    },
    update: {},
  });

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
