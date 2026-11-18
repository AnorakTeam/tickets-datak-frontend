import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import SupportTicketsIndexPage from '~/pages/support/tickets/index.vue'

const { listSupportTicketsMock, getSupportEmpresasMock } = vi.hoisted(() => ({
  listSupportTicketsMock: vi.fn(),
  getSupportEmpresasMock: vi.fn(),
}))

vi.mock('~/services/supportTicketService', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/services/supportTicketService')>()

  return {
    ...original,
    supportTicketService: {
      ...original.supportTicketService,
      listSupportTickets: listSupportTicketsMock,
      getSupportEmpresas: getSupportEmpresasMock,
    },
  }
})

global.definePageMeta = vi.fn()
global.useHead = vi.fn()

const mockSupportTicket = {
  id: 101,
  radicado: 'TK-2026-000101',
  asunto: 'Fallo al procesar nómina',
  empresa: { id: 5, nombre: 'Industrias Acme' },
  modulo: { id: 3, nombre: 'Nómina y Recursos Humanos' },
  prioridad: 'Critica' as const,
  estado: 'En gestion' as const,
  canal_origen: 'WhatsApp',
  responsable: { id: 7, nombre: 'Ing. Carlos Ruiz' },
  fecha_creacion: '2026-11-16T15:30:00Z',
}

const mockEmpresas = [
  { id: 5, nombre: 'Industrias Acme' },
  { id: 6, nombre: 'Servicios Beta' },
]

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
    props: ['to', 'disabled', 'color', 'variant', 'size', 'icon', 'trailingIcon', 'title'],
    emits: ['click'],
    template: `
      <a v-if="to" :href="to"><slot /></a>
      <button v-else :disabled="disabled" @click="$emit('click')"><slot /></button>
    `,
  },
  UInput: {
    props: ['modelValue', 'placeholder', 'icon', 'size'],
    emits: ['update:modelValue'],
    template: `
      <input
        :value="modelValue"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
  UIcon: {
    props: ['name'],
    template: '<i :data-icon="name" />',
  },
}

const mountPage = () => mount(SupportTicketsIndexPage, {
  global: { stubs },
})

describe('Support tickets index page (FE-16)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listSupportTicketsMock.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
    getSupportEmpresasMock.mockResolvedValue(mockEmpresas)
  })

  it('protects the route with support middleware and loads initial data', async () => {
    mountPage()
    await flushPromises()

    expect(global.definePageMeta).toHaveBeenCalledWith({ middleware: 'support' })
    expect(getSupportEmpresasMock).toHaveBeenCalled()
    expect(listSupportTicketsMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 }),
    )
  })

  it('renders support header, external registration action, and table with multi-tenant data', async () => {
    listSupportTicketsMock.mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [mockSupportTicket],
    })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Bandeja unificada de soporte')
    expect(wrapper.text()).toContain('Registrar ticket externo')
    expect(wrapper.text()).toContain('TK-2026-000101')
    expect(wrapper.text()).toContain('Industrias Acme')
    expect(wrapper.text()).toContain('Fallo al procesar nómina')
    expect(wrapper.text()).toContain('WhatsApp')
    expect(wrapper.text()).toContain('Ing. Carlos Ruiz')
    expect(wrapper.text()).toContain('Crítica')
    expect(wrapper.text()).toContain('En gestión')
  })

  it('displays empty state when no tickets match criteria', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('No se encontraron tickets')
    expect(wrapper.text()).toContain('No hay incidencias que coincidan con los filtros aplicados')
  })

  it('displays error message and retries loading', async () => {
    listSupportTicketsMock.mockRejectedValueOnce(new Error('Internal server error'))

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('No fue posible cargar los tickets de soporte')

    listSupportTicketsMock.mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [mockSupportTicket],
    })

    const retryButton = wrapper.findAll('button').find((b) => b.text().includes('Reintentar'))
    expect(retryButton).toBeDefined()
    await retryButton?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('TK-2026-000101')
  })

  it('triggers filter updates when selecting an empresa, estado, prioridad, or canal', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const empresaSelect = wrapper.find('select[aria-label="Filtrar por empresa"]')
    await empresaSelect.setValue('5')
    await flushPromises()

    expect(listSupportTicketsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        empresa: 5,
      }),
    )

    const estadoSelect = wrapper.find('select[aria-label="Filtrar por estado"]')
    await estadoSelect.setValue('Abierto')
    await flushPromises()

    expect(listSupportTicketsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        empresa: 5,
        estado: 'Abierto',
      }),
    )
  })

  it('handles pagination navigation', async () => {
    listSupportTicketsMock.mockResolvedValue({
      count: 15,
      next: 'http://localhost/api/v1/support/tickets/?page=2',
      previous: null,
      results: [mockSupportTicket],
    })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Mostrando página 1 de 2')

    const nextButton = wrapper.findAll('button').find((b) => b.text().includes('Siguiente'))
    expect(nextButton).toBeDefined()
    await nextButton?.trigger('click')
    await flushPromises()

    expect(listSupportTicketsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    )
  })
})
