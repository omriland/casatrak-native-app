import { VisitStatus } from '../types/visit'

export const VISIT_STATUSES: VisitStatus[] = ['scheduled', 'completed', 'cancelled']

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const VISIT_STATUS_COLORS: Record<VisitStatus, string> = {
  scheduled: '#2563EB', // theme.colors.secondary (blue)
  completed: '#059669', // theme.colors.success (green)
  cancelled: '#64748B', // theme.colors.textMuted (gray)
}

export const getVisitStatusLabel = (status: VisitStatus): string => {
  return VISIT_STATUS_LABELS[status] ?? status
}

export const getVisitStatusColor = (status: VisitStatus): string => {
  return VISIT_STATUS_COLORS[status] ?? '#64748B'
}
