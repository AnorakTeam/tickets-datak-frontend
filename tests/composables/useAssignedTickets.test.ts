import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { assignedTicketService } from '~/services/assignedTicketService'
import { useAssignedTickets } from '~/composables/useAssignedTickets'
import type { SupportTicketPage } from '~/services/supportTicketService'

vi.mock('~/services/assignedTicketService', () => ({
  assignedTicketService: { listAssignedTickets: vi.fn() },
}))

const ticketPage = (count: number, next: string | null = null, previous: string | null = null): SupportTicketPage => ({
  count, next, previous,
  results: count ? [{
    id: 1, radicado: 'TK-2026-000001', asunto: 'Caso de prueba',
    empresa: { id: 1, nombre: 'Industrias Acme' },
    modulo: { id: 1, nombre: 'Facturación' },
    prioridad: 'Alta', estado: 'En gestion', canal_origen: 'Portal',
    fecha_creacion: '2026-11-18T12:00:00Z',
  }] : [],
})

const mountComposable = () => {
  let state!: ReturnType<typeof useAssignedTickets>
  const wrapper = mount(defineComponent({
    setup() {
      state = useAssignedTickets()
      return () => h('div')
    },
  }))
  return { state, wrapper }
}

describe('useAssignedTickets (FE-20)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assignedTicketService.listAssignedTickets).mockResolvedValue(ticketPage(0))
  })

  it('loads the engineer queue and defaults to in-progress tickets', async () => {
    const { state, wrapper } = mountComposable()
    await state.loadTickets()
    expect(assignedTicketService.listAssignedTickets).toHaveBeenCalledWith({ page: 1, estado: 'En gestion' })
    expect(state.hasTickets.value).toBe(false)
    wrapper.unmount()
  })

  it('resets pagination when status changes and omits the filter for Todos', async () => {
    const { state, wrapper } = mountComposable()
    await state.changeFilter(null)
    expect(assignedTicketService.listAssignedTickets).toHaveBeenCalledWith({ page: 1, estado: null })
    wrapper.unmount()
  })

  it('uses backend next/previous cursors for page navigation', async () => {
    vi.mocked(assignedTicketService.listAssignedTickets)
      .mockResolvedValueOnce(ticketPage(22, 'next'))
      .mockResolvedValueOnce(ticketPage(22, null, 'previous'))
    const { state, wrapper } = mountComposable()
    await state.loadTickets()
    await state.changePage(1)
    expect(state.currentPage.value).toBe(2)
    expect(assignedTicketService.listAssignedTickets).toHaveBeenLastCalledWith({ page: 2, estado: 'En gestion' })
    wrapper.unmount()
  })

  it('does not overwrite a newer response with stale data', async () => {
    let finishFirst!: (value: ReturnType<typeof ticketPage>) => void
    vi.mocked(assignedTicketService.listAssignedTickets)
      .mockImplementationOnce(() => new Promise<SupportTicketPage>(resolve => { finishFirst = resolve }))
      .mockResolvedValueOnce(ticketPage(0))
    const { state, wrapper } = mountComposable()
    const first = state.loadTickets()
    await state.changeFilter('Resuelto')
    finishFirst(ticketPage(1))
    await first
    await flushPromises()
    expect(state.filter.value).toBe('Resuelto')
    expect(state.tickets.value).toEqual([])
    wrapper.unmount()
  })

  it('shows a safe message when the backend request fails', async () => {
    vi.mocked(assignedTicketService.listAssignedTickets).mockRejectedValueOnce(new Error('private error'))
    const { state, wrapper } = mountComposable()
    await state.loadTickets()
    expect(state.error.value).toContain('No fue posible cargar')
    expect(state.error.value).not.toContain('private error')
    wrapper.unmount()
  })
})
