import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import TicketsIndexPage from '~/pages/tickets/index.vue'

const { listClientTicketsMock } = vi.hoisted(() => ({
  listClientTicketsMock: vi.fn(),
}))

vi.mock('~/services/ticketService', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/services/ticketService')>()

  return {
    ...original,
    ticketService: {
      ...original.ticketService,
      listClientTickets: listClientTicketsMock,
    },
  }
})

global.definePageMeta = vi.fn()
global.useHead = vi.fn()

const ticket = {
  radicado: 'TK-2026-000001',
  asunto: 'Error al emitir factura',
  modulo_nombre: 'Facturación Electrónica',
  prioridad: 'Alta' as const,
  estado: 'En gestion' as const,
  fecha_creacion: '2026-11-14T12:00:00Z',
}

const stubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
  UBadge: {
    props: ['color', 'variant', 'size'],
    template: '<span><slot /></span>',
  },
  UButton: {
    props: ['to', 'disabled'],
    emits: ['click'],
    template: `
      <a v-if="to" :href="to"><slot /></a>
      <button v-else :disabled="disabled" @click="$emit('click')"><slot /></button>
    `,
  },
  UIcon: {
    props: ['name'],
    template: '<i :data-icon="name" />',
  },
  UInput: {
    props: ['modelValue', 'placeholder'],
    template: '<input :value="modelValue" :placeholder="placeholder" />',
  },
  UTable: {
    props: ['columns', 'rows', 'loading'],
    template: `
      <table data-testid="tickets-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="idx">
            <td v-for="col in columns" :key="col.key">
              <slot :name="col.key + '-data'" :row="row" :column="col">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    `,
  },
}

const mountPage = () => mount(TicketsIndexPage, {
  global: { stubs },
})

describe('Tickets index page (FE-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listClientTicketsMock.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  })

  it('loads tickets and protects the route with auth middleware', async () => {
    mountPage()
    await flushPromises()

    expect(listClientTicketsMock).toHaveBeenCalledWith({ page: 1 })
    expect(global.definePageMeta).toHaveBeenCalledWith({ middleware: 'auth' })
  })

  it('renders ticket data and detail navigation', async () => {
    listClientTicketsMock.mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [ticket],
    })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('TK-2026-000001')
    expect(wrapper.text()).toContain('Error al emitir factura')
    expect(wrapper.text()).toContain('Facturación Electrónica')
    expect(wrapper.text()).toContain('En gestión')
    expect(wrapper.find('a[href="/tickets/TK-2026-000001"]').exists()).toBe(true)
  })

  it('changes the status filter through the tabs', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const resolvedTab = wrapper
      .findAll('[role="tab"]')
      .find(tab => tab.text() === 'Resueltos')

    await resolvedTab?.trigger('click')
    await flushPromises()

    expect(listClientTicketsMock).toHaveBeenLastCalledWith({
      page: 1,
      estado: 'Resuelto',
    })
  })

  it('renders a retryable error state', async () => {
    listClientTicketsMock.mockRejectedValueOnce(new Error('Network unavailable'))
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('[data-testid="tickets-error"]').text()).toContain(
      'No fue posible cargar los tickets',
    )

    listClientTicketsMock.mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
    await wrapper.get('[data-testid="tickets-error"] button').trigger('click')
    await flushPromises()

    expect(listClientTicketsMock).toHaveBeenCalledTimes(2)
  })

  it('requests the next page from the paginator', async () => {
    listClientTicketsMock.mockResolvedValue({
      count: 24,
      next: '/api/v1/client/tickets/?page=2',
      previous: null,
      results: [ticket],
    })

    const wrapper = mountPage()
    await flushPromises()
    await wrapper.get('[data-testid="next-page"]').trigger('click')
    await flushPromises()

    expect(listClientTicketsMock).toHaveBeenLastCalledWith({ page: 2 })
  })
})
