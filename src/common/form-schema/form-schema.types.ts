// Shared "configurable form" contract used by ApplicantCategory.profileFieldSchema,
// ReportTemplate.fieldSchema and LegalDocumentTemplate.fieldSchema. Letting these be
// data (JSON) instead of hardcoded DTOs/columns is what lets Directorate staff add a
// new report format or applicant category from the admin UI without a code change.
//
// The frontend has a structurally-identical copy at
// apps/web/src/types/form-schema.ts (kept in sync manually - small and stable enough
// that a shared package would be overhead, not savings).

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'month'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'table'
  | 'section';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  options?: FieldOption[]; // select / radio
  min?: number;
  max?: number;
  minRows?: number;
  maxRows?: number;
  defaultRows?: number;
  columns?: FieldDefinition[]; // table type: one column per FieldDefinition
  fields?: FieldDefinition[]; // section type: nested fields
}

export type FormSchema = FieldDefinition[];
