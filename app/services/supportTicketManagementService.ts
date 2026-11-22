import { apiService } from './api'
import {
  normalizeSupportTicketLookup,
  type SupportTicketDetail,
} from './supportTicketDetailService'
import type { TicketPriority } from './ticketService'

export type SupportTicketClassification = 'Error de uso' | 'Bug' | 'Solicitud de mejora'

export interface AssignableSupportUser {
  id: number
  nombre: string
  correo: string
  rol: 'agente_soporte' | 'responsable_atencion'
}

export interface ClassifyTicketPayload {
  clasificacion: SupportTicketClassification
  prioridad: TicketPriority
}

const ticketActionPath = (lookup: string, action: 'clasificar' | 'asignar' | 'no-procedente'): string => {
  const normalized = normalizeSupportTicketLookup(lookup)
  if (!normalized) throw new Error('Identificador de ticket no válido')
  return `/support/tickets/${encodeURIComponent(normalized)}/${action}/`
}

export const listAssignableSupportUsers = (): Promise<AssignableSupportUser[]> =>
  apiService.get<AssignableSupportUser[]>('/support/responsables/')

export const classifySupportTicket = async (
  lookup: string,
  payload: ClassifyTicketPayload,
): Promise<SupportTicketDetail> =>
  apiService.patch<SupportTicketDetail>(ticketActionPath(lookup, 'clasificar'), payload)

export const assignSupportTicket = async (
  lookup: string,
  responsableId: number,
): Promise<SupportTicketDetail> => {
  if (!Number.isSafeInteger(responsableId) || responsableId <= 0) {
    throw new Error('Seleccione un responsable válido')
  }
  return apiService.patch<SupportTicketDetail>(ticketActionPath(lookup, 'asignar'), {
    responsable_id: responsableId,
  })
}

export const dismissSupportTicket = async (
  lookup: string,
  reason: string,
): Promise<SupportTicketDetail> => {
  const motivo = reason.trim()
  if (!motivo) throw new Error('El motivo de no procedencia es obligatorio')
  return apiService.post<SupportTicketDetail>(ticketActionPath(lookup, 'no-procedente'), {
    motivo_no_procedente: motivo,
  })
}

export const supportTicketManagementService = {
  listAssignableSupportUsers,
  classifySupportTicket,
  assignSupportTicket,
  dismissSupportTicket,
}
