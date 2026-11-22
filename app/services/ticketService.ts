import { apiService } from './api'

export type TicketPriority = 'Baja' | 'Media' | 'Alta' | 'Critica'
export type TicketStatus = 'Abierto' | 'En gestion' | 'Resuelto' | 'No procedente'

export interface CreateTicketPayload {
  modulo_id: number
  pestana_o_documento: string
  asunto: string
  descripcion: string
  mensaje_error?: string
  prioridad: TicketPriority
}

export interface CreateTicketResponse {
  radicado: string
  estado: TicketStatus
  fecha_creacion: string
  asunto: string
  modulo: { id: number; nombre: string }
  mensaje: string
}

export interface ClientTicketSummary {
  radicado: string
  asunto: string
  modulo_nombre: string
  prioridad: TicketPriority
  estado: TicketStatus
  fecha_creacion: string
}

export interface ClientTicketPage {
  count: number
  next: string | null
  previous: string | null
  results: ClientTicketSummary[]
}

export interface ListClientTicketsParams {
  page: number
  estado?: TicketStatus
}

export interface ClientTicketDetail {
  radicado: string
  estado: TicketStatus
  prioridad: TicketPriority
  asunto: string
  descripcion: string
  pestana_o_documento: string
  mensaje_error?: string
  canal_origen: string
  fecha_creacion: string
  fecha_resolucion?: string | null
  modulo?: {
    id: number
    nombre: string
  }
  modulo_nombre?: string
  comentario_solucion?: string
  motivo_no_procedente?: string
}

/**
 * Creates a new support ticket on behalf of the authenticated client (RF1).
 * Consumes endpoint: POST /api/v1/client/tickets/ via Nitro server proxy.
 */
export const createTicket = async (payload: CreateTicketPayload): Promise<CreateTicketResponse> => {
  return await apiService.post<CreateTicketResponse>('/client/tickets/', payload)
}

export const listClientTickets = async (
  params: ListClientTicketsParams,
): Promise<ClientTicketPage> => {
  const query: Record<string, string | number> = {
    page: params.page,
  }

  if (params.estado) {
    query.estado = params.estado
  }

  return await apiService.get<ClientTicketPage>('/client/tickets/', {
    params: query,
  })
}

export const getClientTicket = async (radicado: string): Promise<ClientTicketDetail> => {
  return await apiService.get<ClientTicketDetail>(
    `/client/tickets/${encodeURIComponent(radicado)}/`,
  )
}

export const ticketService = {
  createTicket,
  listClientTickets,
  getClientTicket,
}

export default ticketService
