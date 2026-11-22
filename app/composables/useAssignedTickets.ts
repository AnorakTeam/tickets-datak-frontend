import { computed, onBeforeUnmount, ref } from 'vue'
import { assignedTicketService, type AssignedTicketFilter } from '~/services/assignedTicketService'
import type { SupportTicketSummary } from '~/services/supportTicketService'

export const useAssignedTickets = () => {
  const tickets = ref<SupportTicketSummary[]>([])
  const filter = ref<AssignedTicketFilter>('En gestion')
  const currentPage = ref(1)
  const totalTickets = ref(0)
  const hasNextPage = ref(false)
  const hasPreviousPage = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let requestSequence = 0

  const hasTickets = computed(() => tickets.value.length > 0)

  const loadTickets = async (): Promise<void> => {
    const requestId = ++requestSequence
    isLoading.value = true
    error.value = null
    try {
      const response = await assignedTicketService.listAssignedTickets({
        page: currentPage.value,
        estado: filter.value,
      })
      if (requestId !== requestSequence) return
      tickets.value = response.results
      totalTickets.value = response.count
      hasNextPage.value = response.next !== null
      hasPreviousPage.value = response.previous !== null
    } catch {
      if (requestId !== requestSequence) return
      tickets.value = []
      totalTickets.value = 0
      hasNextPage.value = false
      hasPreviousPage.value = false
      error.value = 'No fue posible cargar tus tickets asignados. Intenta nuevamente.'
    } finally {
      if (requestId === requestSequence) isLoading.value = false
    }
  }

  const changeFilter = async (nextFilter: AssignedTicketFilter): Promise<void> => {
    if (filter.value === nextFilter) return
    filter.value = nextFilter
    currentPage.value = 1
    await loadTickets()
  }

  const changePage = async (delta: -1 | 1): Promise<void> => {
    if (delta === 1 && !hasNextPage.value) return
    if (delta === -1 && !hasPreviousPage.value) return
    currentPage.value += delta
    await loadTickets()
  }

  onBeforeUnmount(() => { ++requestSequence })

  return {
    tickets, filter, currentPage, totalTickets, hasTickets,
    hasNextPage, hasPreviousPage, isLoading, error,
    loadTickets, changeFilter, changePage,
  }
}
