import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { useAssignedTickets } from '~/composables/useAssignedTickets'
import { assignedTicketService } from '~/services/assignedTicketService'
import AssignedTicketsPage from '~/pages/support/mis-tickets.vue'

vi.mock('~/composables/useAssignedTickets', () => ({ useAssignedTickets: vi.fn() }))
vi.mock('~/services/assignedTicketService', () => ({
  assignedTicketService: {
    addInternalTicketNote: vi.fn(),
    resolveAssignedTicket: vi.fn(),
  },
}))

global.definePageMeta = vi.fn()
global.useHead = vi.fn()
const notifyMock = vi.fn()
global.useToast = () => ({ add: notifyMock })

const item = {
  id: 18,
  radicado: 'TK-2026-000018',
  asunto: 'Incidencia asignada',
  empresa: { id: 1, nombre: 'Industrias Acme' },
  modulo: { id: 2, nombre: 'Facturación' },
  prioridad: 'Alta' as const,
  estado: 'En gestion' as const,
  clasificacion: 'Bug',
  canal_origen: 'Portal',
  fecha_creacion: '2026-11-16T16:00:00Z',
}

const stubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
  UIcon: { props: ['name'], template: '<i :data-icon="name" />' },
  UBadge: { template: '<span><slot /></span>' },
  UModal: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div v-if="modelValue" data-testid="modal-container"><slot /></div>',
  },
  UCard: { template: '<div><slot name="header" /><slot /><slot name="footer" /></div>' },
  UTextarea: {
    props: ['modelValue', 'disabled', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<textarea :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  UButton: {
    props: ['to', 'disabled', 'color', 'variant', 'size', 'icon', 'loading'],
    emits: ['click'],
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
    vi.mocked(assignedTicketService.addInternalTicketNote).mockResolvedValue({})
    vi.mocked(assignedTicketService.resolveAssignedTicket).mockResolvedValue({})
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

  it('displays clear classification and priority in the table', () => {
    const wrapper = mount(AssignedTicketsPage, { global: { stubs } })
    expect(wrapper.text()).toContain('Bug')
    expect(wrapper.text()).toContain('Alta')
  })

  it('provides direct access to add an internal note from the row', async () => {
    const wrapper = mount(AssignedTicketsPage, { global: { stubs } })
    const noteBtn = wrapper.find('[data-testid="quick-add-note-btn"]')
    expect(noteBtn.exists()).toBe(true)

    await noteBtn.trigger('click')
    expect(wrapper.find('[data-testid="assigned-note-modal"]').exists()).toBe(true)

    const textarea = wrapper.find('[data-testid="assigned-note-input"]')
    await textarea.setValue('Revisando certificado de facturación.')

    const submitBtn = wrapper.find('[data-testid="assigned-submit-note"]')
    await submitBtn.trigger('click')
    await flushPromises()

    expect(assignedTicketService.addInternalTicketNote).toHaveBeenCalledWith(
      'TK-2026-000018',
      'Revisando certificado de facturación.',
    )
    expect(viewState.loadTickets).toHaveBeenCalled()
  })

  it('provides direct access to resolve a ticket from the row', async () => {
    const wrapper = mount(AssignedTicketsPage, { global: { stubs } })
    const resolveBtn = wrapper.find('[data-testid="quick-resolve-btn"]')
    expect(resolveBtn.exists()).toBe(true)

    await resolveBtn.trigger('click')
    expect(wrapper.find('[data-testid="assigned-resolve-modal"]').exists()).toBe(true)

    const textarea = wrapper.find('[data-testid="assigned-solution-input"]')
    await textarea.setValue('Se actualizó el certificado de la DIAN.')

    const submitBtn = wrapper.find('[data-testid="assigned-submit-resolution"]')
    await submitBtn.trigger('click')
    await flushPromises()

    expect(assignedTicketService.resolveAssignedTicket).toHaveBeenCalledWith(
      'TK-2026-000018',
      'Se actualizó el certificado de la DIAN.',
    )
    expect(viewState.loadTickets).toHaveBeenCalled()
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
