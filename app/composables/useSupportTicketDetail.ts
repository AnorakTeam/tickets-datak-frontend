import { computed, ref } from 'vue'
import { ApiError } from '~/services/api'
import {
  getSupportTicketDetail,
  normalizeSupportTicketLookup,
  type SupportTicketDetail,
  type SupportTicketHistoryItem,
} from '~/services/supportTicketDetailService'

export type SupportTicketDetailError = 'invalid-id' | 'not-found' | 'request-failed' | null

export const useSupportTicketDetail = () => {
  const ticket = ref<SupportTicketDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<SupportTicketDetailError>(null)
  let requestSequence = 0

  const history = computed<SupportTicketHistoryItem[]>(() => {
    if (!ticket.value) return []

    return [...ticket.value.historial].sort((first, second) => {
      const firstTime = Date.parse(first.fecha_creacion) || 0
      const secondTime = Date.parse(second.fecha_creacion) || 0
      return firstTime - secondTime || first.id - second.id
    })
  })

  const loadTicket = async (lookup: string): Promise<void> => {
    const requestId = ++requestSequence
    ticket.value = null
    error.value = null

    const normalized = normalizeSupportTicketLookup(lookup)
    if (!normalized) {
      isLoading.value = false
      error.value = 'invalid-id'
      return
    }

    isLoading.value = true
    try {
      const response = await getSupportTicketDetail(normalized)
      if (requestId !== requestSequence) return
      ticket.value = response
    } catch (cause: unknown) {
      if (requestId !== requestSequence) return
      error.value = cause instanceof ApiError && cause.status === 404
        ? 'not-found'
        : 'request-failed'
    } finally {
      if (requestId === requestSequence) isLoading.value = false
    }
  }

  return { ticket, history, isLoading, error, loadTicket }
}
