import type { TicketPriority, TicketStatus } from '~/services/ticketService'

type BadgeColor = 'blue' | 'amber' | 'green' | 'gray' | 'red'

interface BadgePresentation {
  label: string
  color: BadgeColor
}

const STATUS_PRESENTATION: Record<TicketStatus, BadgePresentation> = {
  Abierto: { label: 'Abierto', color: 'blue' },
  'En gestion': { label: 'En gestión', color: 'amber' },
  Resuelto: { label: 'Resuelto', color: 'green' },
  'No procedente': { label: 'No procedente', color: 'gray' },
}

const PRIORITY_PRESENTATION: Record<TicketPriority, BadgePresentation> = {
  Baja: { label: 'Baja', color: 'gray' },
  Media: { label: 'Media', color: 'blue' },
  Alta: { label: 'Alta', color: 'amber' },
  Critica: { label: 'Crítica', color: 'red' },
}

export const getTicketStatusPresentation = (status: TicketStatus): BadgePresentation => {
  return STATUS_PRESENTATION[status]
}

export const getTicketPriorityPresentation = (priority: TicketPriority): BadgePresentation => {
  return PRIORITY_PRESENTATION[priority]
}

export const formatTicketDate = (value: string): string => {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(value)

  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
