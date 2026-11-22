import { apiService } from './api'
import type { TicketPriority, TicketStatus } from './ticketService'

export interface SupportTicketPerson {
  id: number
  nombre: string
  correo: string
  rol?: string
}

export interface SupportTicketHistoryItem {
  id: number
  ticket: number
  actor: SupportTicketPerson
  tipo_accion: string
  estado_anterior: TicketStatus | null
  estado_nuevo: TicketStatus | null
  responsable_asignado: SupportTicketPerson | null
  es_interna: boolean
  observaciones: string | null
  fecha_creacion: string
}

export interface SupportTicketDetail {
  id: number
  radicado: string
  empresa: { id: number; nombre: string; identificacion: string }
  creado_por: SupportTicketPerson
  registrado_por_agente: SupportTicketPerson | null
  modulo: { id: number; codigo: string; nombre: string }
  pestana_o_documento: string
  asunto: string
  descripcion: string
  mensaje_error: string | null
  prioridad: TicketPriority
  estado: TicketStatus
  clasificacion: string | null
  canal_origen: string
  responsable: SupportTicketPerson | null
  comentario_solucion: string | null
  motivo_no_procedente: string | null
  fecha_creacion: string
  fecha_actualizacion: string
  fecha_resolucion: string | null
  historial: SupportTicketHistoryItem[]
}

// The backend accepts numeric IDs and the project's official TK-AAAA-NNNNNN radicado.
export const normalizeSupportTicketLookup = (lookup: string): string | null => {
  const normalized = lookup.trim()

  if (/^\d+$/.test(normalized)) return normalized
  if (/^TK-\d{4}-\d{6}$/i.test(normalized)) return normalized.toUpperCase()

  return null
}

export const getSupportTicketDetail = async (lookup: string): Promise<SupportTicketDetail> => {
  const normalized = normalizeSupportTicketLookup(lookup)

  if (!normalized) {
    throw new Error('Identificador de ticket no válido')
  }

  return apiService.get<SupportTicketDetail>(`/support/tickets/${encodeURIComponent(normalized)}/`)
}
