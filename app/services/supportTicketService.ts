import { apiService } from './api'
import type { TicketPriority, TicketStatus } from './ticketService'

export interface SupportEmpresa {
  id: number
  nombre: string
  identificacion?: string
  activa?: boolean
}

export interface SupportResponsable {
  id: number
  nombre: string
  correo?: string
  rol?: string
}

export interface SupportTicketSummary {
  id: number
  radicado: string
  asunto: string
  empresa: {
    id: number
    nombre: string
  }
  modulo: {
    id: number
    nombre: string
  }
  prioridad: TicketPriority
  estado: TicketStatus
  canal_origen: string
  responsable?: SupportResponsable | null
  fecha_creacion: string
  fecha_actualizacion?: string
}

export interface SupportTicketPage {
  count: number
  next: string | null
  previous: string | null
  results: SupportTicketSummary[]
}

export interface ListSupportTicketsParams {
  page?: number
  empresa?: number | string | null
  estado?: TicketStatus | null
  prioridad?: TicketPriority | null
  canal_origen?: string | null
  responsable?: number | string | null
  search?: string | null
}

export const listSupportTickets = async (
  params: ListSupportTicketsParams = {},
): Promise<SupportTicketPage> => {
  const query: Record<string, string | number> = {}

  if (params.page) query.page = params.page
  if (params.empresa !== undefined && params.empresa !== null && params.empresa !== '') {
    query.empresa = params.empresa
  }
  if (params.estado) query.estado = params.estado
  if (params.prioridad) query.prioridad = params.prioridad
  if (params.canal_origen) query.canal_origen = params.canal_origen
  if (params.responsable !== undefined && params.responsable !== null && params.responsable !== '') {
    query.responsable = params.responsable
  }
  if (params.search && params.search.trim()) {
    query.search = params.search.trim()
  }

  return await apiService.get<SupportTicketPage>('/support/tickets/', {
    params: query,
  })
}

export const getSupportEmpresas = async (): Promise<SupportEmpresa[]> => {
  return await apiService.get<SupportEmpresa[]>('/support/empresas/')
}

export const supportTicketService = {
  listSupportTickets,
  getSupportEmpresas,
}

export default supportTicketService
