import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { useAssignedTickets } from '~/composables/useAssignedTickets'
import AssignedTicketsPage from '~/pages/support/mis-tickets.vue'

vi.mock('~/composables/useAssignedTickets', () => ({ useAssignedTickets: vi.fn() }))

global.definePageMeta = vi.fn()
global.useHead = vi.fn()

const item = {
  id: 18,
  radicado: 'TK-2026-000018',
  asunto: 'Incidencia asignada',
  empresa: { id: 1, nombre: 'Industrias Acme' },
  modulo: { id: 2, nombre: 'Facturación' },
  prioridad: 'Alta' as const,
  estado: 'En gestion' as const,
  canal_origen: 'Portal',
  fecha_creacion: '2026-11-16T16:00:00Z',
}

const stubs = {
  UIcon: { props: ['name'], template: '<i />' },
  UBadge: { template: '<span><slot /></span>' },
  UButton: {
    props: ['to', 'disabled'], emits: ['click'],
    template: '<a v-if="to" :href="to"><slot /></a><button v-else :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
}

const state = () => ({
  tickets: ref([item]), filter: ref<'En gestion' | 'Resuelto' | null>('En gestion'),
  currentPage: ref(1), totalTickets: ref(1), hasNextPage: ref(false), hasPreviousPage: ref(false),
  isLoading: ref(false), error: ref<string | null>(null),
  loadTickets: vi.fn(), changeFilter: vi.fn(), changePage: vi.fn(),
})

describe('Assigned tickets view (FE-20)', () => {
  let viewState: ReturnType<typeof state>
  beforeEach(() => {
    vi.clearAllMocks()
    viewState = state()
    vi.mocked(useAssignedTickets).mockReturnValue(viewState as unknown as ReturnType<typeof useAssignedTickets>)
  })

  it('protects the view with support middleware and loads the queue', () => {
    mount(AssignedTicketsPage, { global: { stubs } })
    expect(global.definePageMeta).toHaveBeenCalledWith({ middleware: 'support' })
    expect(viewState.loadTickets).toHaveBeenCalledOnce()
  })

  it('uses the Datak layout and links to the existing support ticket detail', () => {
    const wrapper = mount(AssignedTicketsPage, { global: { stubs } })
    expect(wrapper.text()).toContain('Mis tickets asignados')
    expect(wrapper.text()).toContain('Industrias Acme')
    expect(wrapper.text()).toContain('Incidencia asignada')
    expect(wrapper.find('a[href="/support/tickets/18"]').exists()).toBe(true)
  })

  it('changes status using the documented filters', async () => {
    const wrapper = mount(AssignedTicketsPage, { global: { stubs } })
    const button = wrapper.findAll('button').find(node => node.text() === 'Resueltos')
    await button?.trigger('click')
    expect(viewState.changeFilter).toHaveBeenCalledWith('Resuelto')
  })

  it('distinguishes loading, error, and empty states', async () => {
    viewState.isLoading.value = true
    const wrapper = mount(AssignedTicketsPage, { global: { stubs } })
    expect(wrapper.find('[data-testid="assigned-tickets-loading"]').exists()).toBe(true)
    viewState.isLoading.value = false
    viewState.error.value = 'No fue posible cargar tus tickets asignados.'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="assigned-tickets-error"]').exists()).toBe(true)
    viewState.error.value = null
    viewState.tickets.value = []
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="assigned-tickets-empty"]').exists()).toBe(true)
  })
})
