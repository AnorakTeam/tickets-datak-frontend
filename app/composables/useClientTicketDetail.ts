import { ref } from 'vue'
import { ApiError } from '~/services/api'
import {
  ticketService,
  type ClientTicketDetail,
} from '~/services/ticketService'

export type TicketDetailError = 'invalid-radicado' | 'not-found' | 'request-failed'

const RADICADO_PATTERN = /^TK-\d{4}-\d{6}$/

export const useClientTicketDetail = () => {
  const ticket = ref<ClientTicketDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<TicketDetailError | null>(null)

  let requestSequence = 0

  const loadTicket = async (radicado: string) => {
    const normalizedRadicado = radicado.trim()
    const requestId = ++requestSequence

    ticket.value = null
    error.value = null

    if (!RADICADO_PATTERN.test(normalizedRadicado)) {
      error.value = 'invalid-radicado'
      isLoading.value = false
      return
    }

    isLoading.value = true

    try {
      const response = await ticketService.getClientTicket(normalizedRadicado)

      if (requestId === requestSequence) {
        ticket.value = response
      }
    } catch (requestError: unknown) {
      if (requestId !== requestSequence) return

      error.value = requestError instanceof ApiError && requestError.status === 404
        ? 'not-found'
        : 'request-failed'
    } finally {
      if (requestId === requestSequence) {
        isLoading.value = false
      }
    }
  }

  return {
    ticket,
    isLoading,
    error,
    loadTicket,
  }
}
