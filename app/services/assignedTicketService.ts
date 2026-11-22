import { apiService } from './api'
import { normalizeSupportTicketLookup } from './supportTicketDetailService'
import type { SupportTicketPage } from './supportTicketService'

export type AssignedTicketFilter = 'En gestion' | 'Resuelto' | null

export interface AssignedTicketQuery {
  page?: number
  estado?: AssignedTicketFilter
}

export const listAssignedTickets = (query: AssignedTicketQuery = {}): Promise<SupportTicketPage> => {
  const params: Record<string, string | number> = {}
  if (query.page !== undefined) {
    if (!Number.isSafeInteger(query.page) || query.page < 1) {
      throw new Error('Número de página no válido')
    }
    params.page = query.page
  }
  if (query.estado) params.estado = query.estado
  return apiService.get<SupportTicketPage>('/support/mis-tickets/', { params })
}

const actionEndpoint = (lookup: string, action: 'notas-internas' | 'resolver'): string => {
  const normalized = normalizeSupportTicketLookup(lookup)
  if (!normalized) throw new Error('Identificador de ticket no válido')
  return `/support/tickets/${encodeURIComponent(normalized)}/${action}/`
}

export const addInternalTicketNote = (lookup: string, observation: string): Promise<unknown> => {
  const observaciones = observation.trim()
  if (!observaciones) throw new Error('La nota interna no puede estar vacía')
  return apiService.post<unknown>(actionEndpoint(lookup, 'notas-internas'), { observaciones })
}

export const resolveAssignedTicket = (lookup: string, solution: string): Promise<unknown> => {
  const comentario_solucion = solution.trim()
  if (!comentario_solucion) throw new Error('El comentario de solución es obligatorio')
  return apiService.post<unknown>(actionEndpoint(lookup, 'resolver'), { comentario_solucion })
}

export const assignedTicketService = {
  listAssignedTickets,
  addInternalTicketNote,
  resolveAssignedTicket,
}
