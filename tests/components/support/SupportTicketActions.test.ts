import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SupportTicketActions from '~/components/support/SupportTicketActions.vue'
import { ApiError } from '~/services/api'
import type { SupportTicketDetail } from '~/services/supportTicketDetailService'

const { role, listStaff, classify, assign, dismiss, notify } = vi.hoisted(() => ({
  role: { value: 'agente_soporte' },
  listStaff: vi.fn(), classify: vi.fn(), assign: vi.fn(), dismiss: vi.fn(), notify: vi.fn(),
}))

vi.mock('~/stores/auth', () => ({ useAuthStore: () => ({ get userRole() { return role.value } }) }))
vi.mock('~/services/supportTicketManagementService', () => ({
  supportTicketManagementService: {
    listAssignableSupportUsers: listStaff,
    classifySupportTicket: classify,
    assignSupportTicket: assign,
    dismissSupportTicket: dismiss,
  },
}))

Object.assign(global, { useToast: () => ({ add: notify }) })

const ticket: SupportTicketDetail = {
  id: 101,
  radicado: 'TK-2026-000101',
  empresa: { id: 1, nombre: 'Empresa Datak', identificacion: '900123456-7' },
  creado_por: { id: 2, nombre: 'Cliente', correo: 'cliente@datak.co' },
  registrado_por_agente: null,
  modulo: { id: 2, codigo: 'FACT', nombre: 'Facturación' },
  pestana_o_documento: 'Facturación / Vista principal',
  asunto: 'Error al generar factura',
  descripcion: 'No se puede generar la factura.',
  mensaje_error: null,
  estado: 'En gestion',
  prioridad: 'Alta',
  clasificacion: 'Bug',
  canal_origen: 'Portal',
  responsable: { id: 5, nombre: 'Responsable anterior', correo: 'old@datak.co' },
  comentario_solucion: null,
  motivo_no_procedente: null,
  fecha_creacion: '2026-11-18T09:00:00Z',
  fecha_actualizacion: '2026-11-18T10:00:00Z',
  fecha_resolucion: null,
  historial: [],
}

const staff = [
  { id: 5, nombre: 'Responsable anterior', correo: 'old@datak.co', rol: 'responsable_atencion' },
  { id: 8, nombre: 'Responsable nuevo', correo: 'new@datak.co', rol: 'agente_soporte' },
]

const stubs = {
  UButton: {
    props: ['disabled', 'loading', 'color', 'variant', 'block', 'icon'],
    emits: ['click'],
    template: '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
  UIcon: { props: ['name'], template: '<i :data-icon="name" />' },
  UModal: {
    props: ['modelValue', 'preventClose'], emits: ['update:modelValue'],
    template: '<div v-if="modelValue" data-testid="modal-visible"><slot /></div>',
  },
  UCard: { template: '<div><slot name="header" /><slot /><slot name="footer" /></div>' },
  UTextarea: {
    props: ['modelValue', 'rows', 'disabled', 'placeholder'], emits: ['update:modelValue'],
    template: '<textarea :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}

const mounted: Array<{ unmount: () => void }> = []
const mountActions = (properties: Partial<SupportTicketDetail> = {}) => {
  const wrapper = mount(SupportTicketActions, {
    props: { ticket: { ...ticket, ...properties } },
    global: { stubs },
  })
  mounted.push(wrapper)
  return wrapper
}

describe('SupportTicketActions (FE-19)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    role.value = 'agente_soporte'
    listStaff.mockResolvedValue(staff)
    classify.mockResolvedValue(ticket)
    assign.mockResolvedValue(ticket)
    dismiss.mockResolvedValue(ticket)
  })

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  it('loads assignable internal staff for an open ticket', async () => {
    const wrapper = mountActions()
    await flushPromises()
    expect(listStaff).toHaveBeenCalledOnce()
    expect(wrapper.get('[data-testid="support-responsable"]').text()).toContain('Responsable nuevo')
  })

  it('classifies and refreshes the detail only after success', async () => {
    const wrapper = mountActions()
    await flushPromises()
    await wrapper.get('[data-testid="support-classification"]').setValue('Solicitud de mejora')
    await wrapper.get('[data-testid="support-priority"]').setValue('Critica')
    await wrapper.get('[data-testid="support-save-classification"]').trigger('click')
    await flushPromises()
    expect(classify).toHaveBeenCalledWith('TK-2026-000101', {
      clasificacion: 'Solicitud de mejora', prioridad: 'Critica',
    })
    expect(wrapper.emitted('updated')).toHaveLength(1)
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ title: 'Clasificación actualizada' }))
  })

  it('assigns the selected engineer and prevents saving the unchanged engineer', async () => {
    const wrapper = mountActions()
    await flushPromises()
    expect(wrapper.get('[data-testid="support-save-assignment"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-testid="support-responsable"]').setValue('8')
    await wrapper.get('[data-testid="support-save-assignment"]').trigger('click')
    await flushPromises()
    expect(assign).toHaveBeenCalledWith('TK-2026-000101', 8)
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })

  it('requires a nonblank dismissal reason before sending a request', async () => {
    const wrapper = mountActions()
    await flushPromises()
    await wrapper.get('[data-testid="support-open-dismiss"]').trigger('click')
    await nextTick()
    expect(wrapper.get('[data-testid="support-confirm-dismiss"]').attributes('disabled')).toBeDefined()
    await wrapper.get('textarea').setValue('  No corresponde a una falla del sistema.  ')
    await wrapper.get('[data-testid="support-confirm-dismiss"]').trigger('click')
    await flushPromises()
    expect(dismiss).toHaveBeenCalledWith('TK-2026-000101', 'No corresponde a una falla del sistema.')
    expect(wrapper.emitted('updated')).toHaveLength(1)
    expect(wrapper.find('[data-testid="modal-visible"]').exists()).toBe(false)
  })

  it('does not expose mutation controls to non-agent support staff', async () => {
    role.value = 'responsable_atencion'
    const wrapper = mountActions()
    await flushPromises()
    expect(wrapper.get('[data-testid="actions-forbidden"]').text()).toContain('únicamente para agentes')
    expect(wrapper.find('[data-testid="support-save-classification"]').exists()).toBe(false)
    expect(listStaff).not.toHaveBeenCalled()
  })

  it.each(['Resuelto', 'No procedente'])('disables all management operations for %s tickets', async (estado) => {
    const wrapper = mountActions({ estado })
    await flushPromises()
    expect(wrapper.get('[data-testid="actions-closed"]').text()).toContain('Ticket cerrado')
    expect(wrapper.find('[data-testid="support-save-assignment"]').exists()).toBe(false)
    expect(listStaff).not.toHaveBeenCalled()
  })

  it('shows a recoverable error when the responsible staff list fails', async () => {
    listStaff.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(staff)
    const wrapper = mountActions()
    await flushPromises()
    expect(wrapper.text()).toContain('No se pudieron cargar los responsables')
    await wrapper.get('[data-testid="retry-responsables"]').trigger('click')
    await flushPromises()
    expect(listStaff).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Responsable nuevo')
  })

  it('displays server validation feedback without refreshing on failure', async () => {
    classify.mockRejectedValueOnce(new ApiError('Clasificación inválida', 400))
    const wrapper = mountActions()
    await flushPromises()
    await wrapper.get('[data-testid="support-save-classification"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="support-actions-error"]').text()).toContain('Clasificación inválida')
    expect(wrapper.emitted('updated')).toBeUndefined()
  })

  it('prevents concurrent duplicate submissions while a mutation is in flight', async () => {
    let resolve!: (value: typeof ticket) => void
    classify.mockReturnValueOnce(new Promise<typeof ticket>((done) => { resolve = done }))
    const wrapper = mountActions()
    await flushPromises()
    await wrapper.get('[data-testid="support-save-classification"]').trigger('click')
    expect(wrapper.get('[data-testid="support-save-classification"]').attributes('disabled')).toBeDefined()
    expect(classify).toHaveBeenCalledTimes(1)
    resolve(ticket)
    await flushPromises()
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })

  it('ignores a stale mutation response after navigation to another ticket', async () => {
    let resolve!: (value: typeof ticket) => void
    classify.mockReturnValueOnce(new Promise<typeof ticket>((done) => { resolve = done }))
    const wrapper = mountActions()
    await flushPromises()
    await wrapper.get('[data-testid="support-save-classification"]').trigger('click')
    await wrapper.setProps({ ticket: { ...ticket, id: 102, radicado: 'TK-2026-000102' } })
    resolve(ticket)
    await flushPromises()
    expect(wrapper.emitted('updated')).toBeUndefined()
  })
})
