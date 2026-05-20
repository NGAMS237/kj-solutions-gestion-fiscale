/**
 * Enums centralisés — portables entre PostgreSQL (enum natif) et SQLite (String).
 *
 * En mode Postgres, ces valeurs correspondent exactement aux variants Prisma générés.
 * En mode SQLite, le schéma stocke en String : on relie tout au runtime grâce à ces unions.
 */

export const TaxStatus = {
  TAXABLE: 'TAXABLE',
  EXEMPT: 'EXEMPT',
  ZERO_RATED: 'ZERO_RATED',
} as const;
export type TaxStatus = typeof TaxStatus[keyof typeof TaxStatus];

export const ClientType = {
  PARTICULIER: 'PARTICULIER',
  ENTREPRISE: 'ENTREPRISE',
  GARDERIE: 'GARDERIE',
} as const;
export type ClientType = typeof ClientType[keyof typeof ClientType];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  INTERAC: 'INTERAC',
  CHEQUE: 'CHEQUE',
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
  STRIPE: 'STRIPE',
  MONERIS: 'MONERIS',
  OTHER: 'OTHER',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const RecurrenceInterval = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
} as const;
export type RecurrenceInterval = typeof RecurrenceInterval[keyof typeof RecurrenceInterval];

export const UserRole = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  ACCOUNTANT: 'ACCOUNTANT',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];
