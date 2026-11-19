import { computed, ref } from 'vue'
import {
  ticketService,
  type ClientTicketSummary,
  type TicketStatus,
} from '~/services/ticketService'

const PAGE_SIZE = 10

export const useClientTickets = () => {
  const tickets = ref<ClientTicketSummary[]>([])
  const currentPage = ref(1)
  const selectedStatus = ref<TicketStatus | null>(null)
  const totalTickets = ref(0)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  let requestSequence = 0

  const totalPages = computed(() => Math.max(1, Math.ceil(totalTickets.value / PAGE_SIZE)))
  const hasPreviousPage = computed(() => currentPage.value > 1)
  const hasNextPage = computed(() => currentPage.value < totalPages.value)

  const loadTickets = async () => {
    const requestId = ++requestSequence
    isLoading.value = true
    errorMessage.value = null

    try {
      const response = await ticketService.listClientTickets({
        page: currentPage.value,
        ...(selectedStatus.value ? { estado: selectedStatus.value } : {}),
      })

      if (requestId !== requestSequence) return

      tickets.value = response.results
      totalTickets.value = response.count
    } catch {
      if (requestId !== requestSequence) return

      tickets.value = []
      totalTickets.value = 0
      errorMessage.value = 'No fue posible cargar los tickets. Intenta nuevamente.'
    } finally {
      if (requestId === requestSequence) {
        isLoading.value = false
      }
    }
  }

  const selectStatus = async (status: TicketStatus | null) => {
    selectedStatus.value = status
    currentPage.value = 1
    await loadTickets()
  }

  const selectPage = async (page: number) => {
    const normalizedPage = Math.min(Math.max(page, 1), totalPages.value)

    if (normalizedPage === currentPage.value) return

    currentPage.value = normalizedPage
    await loadTickets()
  }

  return {
    tickets,
    currentPage,
    selectedStatus,
    totalTickets,
    totalPages,
    isLoading,
    errorMessage,
    hasPreviousPage,
    hasNextPage,
    loadTickets,
    selectStatus,
    selectPage,
  }
}
