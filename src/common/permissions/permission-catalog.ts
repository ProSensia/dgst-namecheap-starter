import { PermissionAction } from '@prisma/client';

export const RESOURCES = {
  USER: 'USER',
  ROLE: 'ROLE',
  APPLICANT_CATEGORY: 'APPLICANT_CATEGORY',
  PROGRAM: 'PROGRAM',
  APPLICATION: 'APPLICATION',
  PROJECT: 'PROJECT',
  ATTACHMENT: 'ATTACHMENT',
  REPORT_TEMPLATE: 'REPORT_TEMPLATE',
  REPORT: 'REPORT',
  VERIFICATION: 'VERIFICATION',
  AUDIT_LOG: 'AUDIT_LOG',
} as const;

export interface PermissionCatalogEntry {
  resource: string;
  action: PermissionAction;
  label: string;
}

/**
 * The full permission catalog seeded into the database. This is the "code-owned" half
 * of RBAC (spec #9): a guard can only ever check for a (resource, action) pair that
 * exists here. What stays fully dynamic - creatable by Super Admin with zero code
 * changes - is which Roles are granted which of these catalog entries, and which Users
 * hold which Roles.
 */
export const PERMISSION_CATALOG: PermissionCatalogEntry[] = [
  { resource: RESOURCES.USER, action: 'VIEW', label: 'View users' },
  { resource: RESOURCES.USER, action: 'CREATE', label: 'Create users' },
  { resource: RESOURCES.USER, action: 'EDIT', label: 'Edit users' },
  { resource: RESOURCES.USER, action: 'MANAGE_USERS', label: 'Manage user accounts & status' },

  { resource: RESOURCES.ROLE, action: 'VIEW', label: 'View roles & permissions' },
  { resource: RESOURCES.ROLE, action: 'CREATE', label: 'Create roles' },
  { resource: RESOURCES.ROLE, action: 'EDIT', label: 'Edit roles & assign permissions' },
  { resource: RESOURCES.ROLE, action: 'DELETE', label: 'Delete non-system roles' },

  { resource: RESOURCES.APPLICANT_CATEGORY, action: 'VIEW', label: 'View applicant categories' },
  { resource: RESOURCES.APPLICANT_CATEGORY, action: 'CREATE', label: 'Create applicant categories' },
  { resource: RESOURCES.APPLICANT_CATEGORY, action: 'EDIT', label: 'Edit applicant categories' },

  { resource: RESOURCES.PROGRAM, action: 'VIEW', label: 'View funding programs' },
  { resource: RESOURCES.PROGRAM, action: 'CREATE', label: 'Create funding programs' },
  { resource: RESOURCES.PROGRAM, action: 'EDIT', label: 'Edit funding programs' },
  { resource: RESOURCES.PROGRAM, action: 'DELETE', label: 'Delete/archive funding programs' },

  { resource: RESOURCES.APPLICATION, action: 'VIEW', label: 'View applications' },
  { resource: RESOURCES.APPLICATION, action: 'CREATE', label: 'Submit applications' },
  { resource: RESOURCES.APPLICATION, action: 'EDIT', label: 'Edit applications' },
  { resource: RESOURCES.APPLICATION, action: 'APPROVE', label: 'Approve applications' },
  { resource: RESOURCES.APPLICATION, action: 'REJECT', label: 'Reject applications' },
  { resource: RESOURCES.APPLICATION, action: 'REQUEST_CORRECTION', label: 'Request corrections on applications' },

  { resource: RESOURCES.PROJECT, action: 'VIEW', label: 'View projects/awards' },
  { resource: RESOURCES.PROJECT, action: 'EDIT', label: 'Edit project/award records' },
  { resource: RESOURCES.PROJECT, action: 'VERIFY', label: 'Verify award/project records' },

  { resource: RESOURCES.ATTACHMENT, action: 'VIEW', label: 'View documents' },
  { resource: RESOURCES.ATTACHMENT, action: 'CREATE', label: 'Upload documents' },
  { resource: RESOURCES.ATTACHMENT, action: 'DOWNLOAD', label: 'Download documents' },
  { resource: RESOURCES.ATTACHMENT, action: 'VERIFY', label: 'Verify uploaded documents' },

  { resource: RESOURCES.REPORT_TEMPLATE, action: 'VIEW', label: 'View report templates' },
  { resource: RESOURCES.REPORT_TEMPLATE, action: 'CREATE', label: 'Create report templates' },
  { resource: RESOURCES.REPORT_TEMPLATE, action: 'EDIT', label: 'Edit report templates' },

  { resource: RESOURCES.REPORT, action: 'VIEW', label: 'View reports' },
  { resource: RESOURCES.REPORT, action: 'CREATE', label: 'Create/submit reports' },
  { resource: RESOURCES.REPORT, action: 'EDIT', label: 'Edit report drafts' },
  { resource: RESOURCES.REPORT, action: 'APPROVE', label: 'Approve reports' },
  { resource: RESOURCES.REPORT, action: 'REJECT', label: 'Reject reports' },
  { resource: RESOURCES.REPORT, action: 'REQUEST_CORRECTION', label: 'Request corrections on reports' },
  { resource: RESOURCES.REPORT, action: 'COMMUNICATE', label: 'Comment on reports' },
  { resource: RESOURCES.REPORT, action: 'EXPORT', label: 'Export/download report PDFs' },

  { resource: RESOURCES.VERIFICATION, action: 'VIEW', label: 'View verification records (staff)' },
  { resource: RESOURCES.VERIFICATION, action: 'CREATE', label: 'Issue verification records' },
  { resource: RESOURCES.VERIFICATION, action: 'VERIFY', label: 'Revoke/manage verification records' },

  { resource: RESOURCES.AUDIT_LOG, action: 'VIEW', label: 'View audit logs' },
  { resource: RESOURCES.AUDIT_LOG, action: 'EXPORT', label: 'Export audit logs' },
];
