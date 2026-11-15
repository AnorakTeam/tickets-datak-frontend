import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { ApiError } from '~/services/api'
import TicketDetailPage from '~/pages/tickets/[radicado].vue'

const { getClientTicketMock } = vi.hoisted(() => ({
  getClientTicketMock: vi.fn(),
}))

vi.mock('~/services/ticketService', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/services/ticketService')>()

  return {
    ...original,
    ticketService: {
      ...original.ticketService,
      getClientTicket: getClientTicketMock,
    },
  }
})

const route = reactive({
  params: {
    radicado: 'TK-2026-000042' as string | string[],
  },
})

global.definePageMeta = vi.fn()
global.useHead = vi.fn()
global.useRoute = () => route

const baseTicket = {
  radicado: 'TK-2026-000042',
  estado: 'En gestion' as const,
  prioridad: 'Alta' as const,
  asunto: 'Error al emitir factura',
  descripcion: 'La factura no se genera después de confirmar el formulario.',
  pestana_o_documento: 'Emisión de facturas / F-203',
  mensaje_error: 'Código E-500',
  canal_origen: 'Portal',
  fecha_creacion: '2026-11-14T18:30:00Z',
  modulo_nombre: 'Facturación Electrónica',
  fecha_resolucion: null,
}

const stubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
  UBadge: {
    props: ['color', 'variant'],
    template: '<span><slot /></span>',
  },
  UButton: {
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
  },
  UIcon: {
    props: ['name'],
    template: '<i :data-icon="name" />',
  },
}

const mountPage = () => mount(TicketDetailPage, {
  global: { stubs },
})

describe('Ticket detail page (FE-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.params.radicado = 'TK-2026-000042'
    getClientTicketMock.mockResolvedValue(baseTicket)

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    })
  })

  it('loads the route radicado and protects the page with auth middleware', async () => {
    mountPage()
    await flushPromises()

    expect(getClientTicketMock).toHaveBeenCalledWith('TK-2026-000042')
    expect(global.definePageMeta).toHaveBeenCalledWith({ middleware: 'auth' })
  })

  it('renders public ticket fields without exposing injected internal data', async () => {
    getClientTicketMock.mockResolvedValueOnce({
      ...baseTicket,
      responsable: 'Agente interno',
      responsable_id: 15,
      notas_internas: 'Información privada del equipo',
      estimacion_tecnica: 8,
    })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Error al emitir factura')
    expect(wrapper.text()).toContain('Facturación Electrónica')
    expect(wrapper.text()).toContain('Emisión de facturas / F-203')
    expect(wrapper.text()).toContain('Código E-500')
    expect(wrapper.text()).not.toContain('Agente interno')
    expect(wrapper.text()).not.toContain('Información privada del equipo')
    expect(wrapper.text()).not.toContain('estimacion_tecnica')
    expect(wrapper.text()).not.toContain('8 horas')
  })

  it('shows the solution only for a resolved ticket', async () => {
    getClientTicketMock.mockResolvedValueOnce({
      ...baseTicket,
      estado: 'Resuelto',
      comentario_solucion: 'Se corrigió la regla de validación.',
      motivo_no_procedente: 'Este texto no debe mostrarse.',
      fecha_resolucion: '2026-11-14T20:00:00Z',
    })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('[data-testid="solution-card"]').text()).toContain(
      'Se corrigió la regla de validación.',
    )
    expect(wrapper.find('[data-testid="non-proceeding-card"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Este texto no debe mostrarse.')
  })

  it('shows the non-proceeding reason only for a non-proceeding ticket', async () => {
    getClientTicketMock.mockResolvedValueOnce({
      ...baseTicket,
      estado: 'No procedente',
      comentario_solucion: 'Este texto no debe mostrarse.',
      motivo_no_procedente: 'La solicitud no corresponde a soporte.',
    })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('[data-testid="non-proceeding-card"]').text()).toContain(
      'La solicitud no corresponde a soporte.',
    )
    expect(wrapper.find('[data-testid="solution-card"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Este texto no debe mostrarse.')
  })

  it('presents a generic message for a 404 response', async () => {
    getClientTicketMock.mockRejectedValueOnce(new ApiError('Tenant mismatch', 404))

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('[data-testid="ticket-detail-error"]').text()).toContain(
      'Ticket no encontrado',
    )
    expect(wrapper.text()).not.toContain('Tenant mismatch')
  })

  it('retries after a request failure', async () => {
    getClientTicketMock
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(baseTicket)

    const wrapper = mountPage()
    await flushPromises()
    await wrapper.get('[data-testid="retry-ticket-detail"]').trigger('click')
    await flushPromises()

    expect(getClientTicketMock).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Error al emitir factura')
  })

  it('copies the radicado and confirms success only after the clipboard resolves', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.get('[data-testid="copy-ticket-radicado"]').trigger('click')
    await flushPromises()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TK-2026-000042')
    expect(wrapper.get('[data-testid="copy-feedback"]').text()).toBe('Radicado copiado.')
  })

  it('reports a copy failure when the Clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })

    const wrapper = mountPage()
    await flushPromises()
    await wrapper.get('[data-testid="copy-ticket-radicado"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="copy-feedback"]').text()).toBe(
      'No fue posible copiar el radicado.',
    )
  })

  it('rejects an invalid route radicado without making a request', async () => {
    route.params.radicado = '../internal-ticket'

    const wrapper = mountPage()
    await flushPromises()

    expect(getClientTicketMock).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="ticket-detail-error"]').text()).toContain(
      'Radicado no válido',
    )
  })
})
