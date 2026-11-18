import { computed, ref } from 'vue'
import {
  supportTicketService,
  type SupportEmpresa,
  type SupportTicketSummary,
} from '~/services/supportTicketService'
import type { TicketPriority, TicketStatus } from '~/services/ticketService'

const DEFAULT_PAGE_SIZE = 10

export const useSupportTickets = () => {
  const tickets = ref<SupportTicketSummary[]>([])
  const totalTickets = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(DEFAULT_PAGE_SIZE)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  // Filters
  const selectedEmpresa = ref<number | null>(null)
  const selectedStatus = ref<TicketStatus | null>(null)
  const selectedPriority = ref<TicketPriority | null>(null)
  const selectedChannel = ref<string | null>(null)
  const searchQuery = ref('')

  // Companies catalog
  const empresas = ref<SupportEmpresa[]>([])
  const isLoadingEmpresas = ref(false)

  let requestSequence = 0

  const totalPages = computed(() => Math.max(1, Math.ceil(totalTickets.value / pageSize.value)))
  const hasPreviousPage = computed(() => currentPage.value > 1)
  const hasNextPage = computed(() => currentPage.value < totalPages.value)

  const loadEmpresas = async () => {
    isLoadingEmpresas.value = true
    try {
      empresas.value = await supportTicketService.getSupportEmpresas()
    } catch {
      empresas.value = []
    } finally {
      isLoadingEmpresas.value = false
    }
  }

  const loadTickets = async () => {
    const requestId = ++requestSequence
    isLoading.value = true
    errorMessage.value = null

    try {
      const response = await supportTicketService.listSupportTickets({
        page: currentPage.value,
        empresa: selectedEmpresa.value,
        estado: selectedStatus.value,
        prioridad: selectedPriority.value,
        canal_origen: selectedChannel.value,
        search: searchQuery.value,
      })

      if (requestId !== requestSequence) return

      tickets.value = response.results
      totalTickets.value = response.count
    } catch {
      if (requestId !== requestSequence) return

      tickets.value = []
      totalTickets.value = 0
      errorMessage.value = 'No fue posible cargar los tickets de soporte. Intenta nuevamente.'
    } finally {
      if (requestId === requestSequence) {
        isLoading.value = false
      }
    }
  }

  const setEmpresa = async (empresaId: number | null) => {
    selectedEmpresa.value = empresaId
    currentPage.value = 1
    await loadTickets()
  }

  const setStatus = async (status: TicketStatus | null) => {
    selectedStatus.value = status
    currentPage.value = 1
    await loadTickets()
  }

  const setPriority = async (priority: TicketPriority | null) => {
    selectedPriority.value = priority
    currentPage.value = 1
    await loadTickets()
  }

  const setChannel = async (channel: string | null) => {
    selectedChannel.value = channel
    currentPage.value = 1
    await loadTickets()
  }

  const setSearch = async (search: string) => {
    searchQuery.value = search
    currentPage.value = 1
    await loadTickets()
  }

  const clearFilters = async () => {
    selectedEmpresa.value = null
    selectedStatus.value = null
    selectedPriority.value = null
    selectedChannel.value = null
    searchQuery.value = ''
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
    totalTickets,
    currentPage,
    pageSize,
    isLoading,
    errorMessage,
    selectedEmpresa,
    selectedStatus,
    selectedPriority,
    selectedChannel,
    searchQuery,
    empresas,
    isLoadingEmpresas,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    loadEmpresas,
    loadTickets,
    setEmpresa,
    setStatus,
    setPriority,
    setChannel,
    setSearch,
    clearFilters,
    selectPage,
  }
}
