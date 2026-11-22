import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { ApiError } from '~/services/api'
import SupportTicketDetailPage from '~/pages/support/tickets/[id].vue'

const { getSupportTicketDetailMock } = vi.hoisted(() => ({
  getSupportTicketDetailMock: vi.fn(),
}))

vi.mock('~/services/supportTicketDetailService', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/services/supportTicketDetailService')>()
  return { ...original, getSupportTicketDetail: getSupportTicketDetailMock }
})

const route = reactive({ params: { id: '101' as string | string[] } })

global.definePageMeta = vi.fn()
global.useHead = vi.fn()
global.useRoute = () => route

const baseTicket = {
  id: 101,
  radicado: 'TK-2026-000101',
  asunto: 'Error al emitir factura',
  empresa: { id: 1, nombre: 'Industrias Acme', identificacion: '900123456-7' },
  creado_por: { id: 2, nombre: 'Carlos Gómez', correo: 'cliente@acme.co' },
  registrado_por_agente: { id: 3, nombre: 'Ana Soporte', correo: 'soporte@datak.co' },
  modulo: { id: 4, nombre: 'Facturación electrónica', codigo: 'FACT' },
  pestana_o_documento: 'Emisión de facturas',
  descripcion: 'Se presenta un error al generar el documento.',
  mensaje_error: 'Error de firma digital',
  prioridad: 'Alta',
  estado: 'En gestion',
  clasificacion: 'Bug',
  canal_origen: 'WhatsApp',
  responsable: { id: 5, nombre: 'Ingeniero Ruiz', correo: 'ingeniero@datak.co' },
  comentario_solucion: null,
  motivo_no_procedente: null,
  fecha_creacion: '2026-11-16T15:30:00Z',
  fecha_actualizacion: '2026-11-17T12:30:00Z',
  fecha_resolucion: null,
  historial: [
    {
      id: 2, ticket: 101, tipo_accion: 'NOTA_INTERNA',
      actor: { id: 5, nombre: 'Ingeniero Ruiz', correo: 'ingeniero@datak.co' },
      estado_anterior: null, estado_nuevo: null, responsable_asignado: null,
      es_interna: true, observaciones: 'Revisar certificado privado.',
      fecha_creacion: '2026-11-17T11:00:00Z',
    },
    {
      id: 1, ticket: 101, tipo_accion: 'CREACION',
      actor: { id: 3, nombre: 'Ana Soporte', correo: 'soporte@datak.co' },
      estado_anterior: null, estado_nuevo: 'Abierto', responsable_asignado: null,
      es_interna: false, observaciones: 'Ticket recibido por WhatsApp.',
      fecha_creacion: '2026-11-16T15:30:00Z',
    },
  ],
}

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  UBadge: { props: ['color', 'variant', 'size'], template: '<span><slot /></span>' },
  UIcon: { props: ['name'], template: '<i :data-icon="name" />' },
  UButton: {
    props: ['disabled', 'color', 'variant', 'icon'],
    emits: ['click'],
    template: '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
}

const mountedPages: Array<{ unmount: () => void }> = []
const mountPage = () => {
  const wrapper = mount(SupportTicketDetailPage, { global: { stubs } })
  mountedPages.push(wrapper)
  return wrapper
}

describe('Support ticket detail page (FE-18)', () => {
  afterEach(() => {
    mountedPages.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  beforeEach(() => {
    vi.clearAllMocks()
    route.params.id = '101'
    getSupportTicketDetailMock.mockResolvedValue(baseTicket)
  })

  it('uses the internal support middleware and loads the selected ticket', async () => {
    mountPage()
    await flushPromises()

    expect(global.definePageMeta).toHaveBeenCalledWith({ middleware: 'support' })
    expect(getSupportTicketDetailMock).toHaveBeenCalledWith('101')
  })

  it('renders Datak report metadata, agent and complete internal audit timeline', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Error al emitir factura')
    expect(wrapper.text()).toContain('Industrias Acme')
    expect(wrapper.text()).toContain('Carlos Gómez')
    expect(wrapper.text()).toContain('Ana Soporte')
    expect(wrapper.text()).toContain('Ingeniero Ruiz')
    expect(wrapper.text()).toContain('Error de firma digital')
    expect(wrapper.text()).toContain('Revisar certificado privado.')
    expect(wrapper.get('[data-testid="support-history-timeline"]').text()).toContain('Nota interna')
    const audit = wrapper.findAll('[data-testid="support-history-event"]')
    expect(audit).toHaveLength(2)
    expect(audit[0]?.text()).toContain('Creación del ticket')
    expect(audit[1]?.text()).toContain('Nota interna')
    expect(wrapper.get('[data-testid="support-management-summary"]').text()).toContain('Bug')
  })

  it('shows a generic 404 message without leaking server details', async () => {
    getSupportTicketDetailMock.mockRejectedValueOnce(new ApiError('Private DB lookup', 404))
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('[data-testid="support-detail-error"]').text()).toContain('Ticket no encontrado')
    expect(wrapper.text()).not.toContain('Private DB lookup')
  })

  it('rejects an invalid identifier before requesting the backend', async () => {
    route.params.id = '../admin'
    const wrapper = mountPage()
    await flushPromises()

    expect(getSupportTicketDetailMock).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="support-detail-error"]').text()).toContain('Identificador no válido')
  })

  it('retries after a connection failure', async () => {
    getSupportTicketDetailMock
      .mockRejectedValueOnce(new Error('Connection lost'))
      .mockResolvedValueOnce(baseTicket)
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-testid="support-detail-retry"]').trigger('click')
    await flushPromises()

    expect(getSupportTicketDetailMock).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Error al emitir factura')
  })

  it('handles an empty audit timeline and missing optional agent and owner', async () => {
    getSupportTicketDetailMock.mockResolvedValueOnce({
      ...baseTicket, historial: [], registrado_por_agente: null, responsable: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.get('[data-testid="support-history-empty"]').text()).toContain('no registra eventos')
    expect(wrapper.text()).toContain('Registrado por el cliente')
    expect(wrapper.text()).toContain('Sin asignar')
  })

  it('reloads correctly when navigating to a different support ticket', async () => {
    const wrapper = mountPage()
    await flushPromises()
    route.params.id = '102'
    getSupportTicketDetailMock.mockResolvedValueOnce({
      ...baseTicket, id: 102, asunto: 'Segundo caso', radicado: 'TK-2026-000102',
    })
    await nextTick()
    await flushPromises()

    expect(getSupportTicketDetailMock).toHaveBeenLastCalledWith('102')
    expect(wrapper.text()).toContain('Segundo caso')
  })

  it('shows a success message only when copying the radicado works', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-testid="support-detail-copy"]').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('TK-2026-000101')
    expect(wrapper.get('[data-testid="support-detail-copy-feedback"]').text()).toBe('Radicado copiado.')
  })
})
