// Shared enums that match the previous Prisma enum definitions.
// Using this so we still have type safety while using SQLite strings.

export enum Skill {
  HEAVY_PHYSICAL = 'HEAVY_PHYSICAL',
  MEDIUM_PHYSICAL = 'MEDIUM_PHYSICAL',
  LIGHT_PHYSICAL = 'LIGHT_PHYSICAL',
  MEDICAL = 'MEDICAL',
  TRANSLATION = 'TRANSLATION',
  CHILDCARE = 'CHILDCARE',
  ADMINISTRATION = 'ADMINISTRATION',
  INFORMATION_RETRIEVAL = 'INFORMATION_RETRIEVAL',
  OTHER = 'OTHER'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FULL = 'FULL',
  INACTIVE = 'INACTIVE'
}

export enum AssignmentStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum AutomationMode {
  MANUAL = 'MANUAL',
  SEMI_AUTO = 'SEMI_AUTO',
  AUTO = 'AUTO'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
