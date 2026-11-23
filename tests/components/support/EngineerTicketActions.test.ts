import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { ApiError } from '~/services/api'
import { assignedTicketService } from '~/services/assignedTicketService'
import EngineerTicketActions from '~/components/support/EngineerTicketActions.vue'
import type { SupportTicketDetail } from '~/services/supportTicketDetailService'

vi.mock('~/services/assignedTicketService', () => ({
  assignedTicketService: { addInternalTicketNote: vi.fn(), resolveAssignedTicket: vi.fn() },
}))

const auth = reactive({
  userRole: 'responsable_atencion',
  user: { id: 7 },
})
vi.mock('~/stores/auth', () => ({ useAuthStore: () => auth }))
const addToast = vi.fn()
Object.assign(global, { useToast: () => ({ add: addToast }) })

const ticket = {
  id: 11, radicado: 'TK-2026-000011', estado: 'En gestion',
  responsable: { id: 7, nombre: 'Ingeniera Ruiz', correo: 'ruiz@datak.co' },
} as SupportTicketDetail

const stubs = {
  UIcon: { template: '<i />' },
  UBadge: { template: '<span><slot /></span>' },
  UCard: { template: '<div><slot name="header"/><slot/><slot name="footer"/></div>' },
  UModal: {
    props: ['modelValue'], emits: ['update:modelValue'],
    template: '<section v-if="modelValue"><slot /></section>',
  },
  UTextarea: {
    props: ['modelValue', 'disabled', 'placeholder'], emits: ['update:modelValue'],
    template: '<textarea :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  UButton: {
    props: ['disabled', 'loading'], emits: ['click'],
    template: '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
}

const mounted: Array<{ unmount(): void }> = []
const mountActions = (value: SupportTicketDetail = ticket) => {
  const wrapper = mount(EngineerTicketActions, { props: { ticket: value }, global: { stubs } })
  mounted.push(wrapper)
  return wrapper
}

describe('Engineer ticket actions (FE-20)', () => {
  afterEach(() => { mounted.splice(0).forEach(wrapper => wrapper.unmount()) })
  beforeEach(() => {
    vi.clearAllMocks()
    auth.userRole = 'responsable_atencion'
    auth.user.id = 7
    vi.mocked(assignedTicketService.addInternalTicketNote).mockResolvedValue({})
    vi.mocked(assignedTicketService.resolveAssignedTicket).mockResolvedValue({})
  })

  it('does not allow a non-assigned user to manage the ticket', () => {
    auth.user.id = 99
    const wrapper = mountActions()
    expect(wrapper.find('[data-testid="engineer-not-assigned"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="engineer-add-note"]').exists()).toBe(false)
  })

  it('does not show actions for a closed ticket', () => {
    const wrapper = mountActions({ ...ticket, estado: 'Resuelto' })
    expect(wrapper.find('[data-testid="engineer-closed"]').exists()).toBe(true)
  })

  it('adds a private note, emits an update and clears the input', async () => {
    const wrapper = mountActions()
    await wrapper.find('[data-testid="engineer-note-input"]').setValue('  Revisar registro interno  ')
    await wrapper.get('[data-testid="engineer-add-note"]').trigger('click')
    await flushPromises()
    expect(assignedTicketService.addInternalTicketNote).toHaveBeenCalledWith('TK-2026-000011', 'Revisar registro interno')
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })

  it('does not submit an empty internal note', async () => {
    const wrapper = mountActions()
    await wrapper.get('[data-testid="engineer-add-note"]').trigger('click')
    expect(assignedTicketService.addInternalTicketNote).not.toHaveBeenCalled()
  })

  it('requires an official solution before resolving', async () => {
    const wrapper = mountActions()
    await wrapper.get('[data-testid="engineer-open-resolve"]').trigger('click')
    expect(wrapper.find('[data-testid="engineer-resolve-modal"]').exists()).toBe(true)
    await wrapper.get('[data-testid="engineer-confirm-resolve"]').trigger('click')
    expect(assignedTicketService.resolveAssignedTicket).not.toHaveBeenCalled()
  })

  it('submits a solution after confirmation and updates the timeline', async () => {
    const wrapper = mountActions()
    await wrapper.get('[data-testid="engineer-open-resolve"]').trigger('click')
    await wrapper.get('[data-testid="engineer-solution-input"]').setValue('  Reiniciamos el servicio. ')
    await wrapper.get('[data-testid="engineer-confirm-resolve"]').trigger('click')
    await flushPromises()
    expect(assignedTicketService.resolveAssignedTicket).toHaveBeenCalledWith('TK-2026-000011', 'Reiniciamos el servicio.')
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })

  it('keeps the ticket unchanged after a rejected request', async () => {
    vi.mocked(assignedTicketService.addInternalTicketNote).mockRejectedValueOnce(new ApiError('Forbidden', 403))
    const wrapper = mountActions()
    await wrapper.find('[data-testid="engineer-note-input"]').setValue('Comentario privado')
    await wrapper.get('[data-testid="engineer-add-note"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('updated')).toBeUndefined()
    expect(wrapper.get('[data-testid="engineer-action-error"]').text()).toContain('No tienes permisos')
  })

  it('prevents a duplicate submission while a request is pending', async () => {
    let release!: (value: unknown) => void
    vi.mocked(assignedTicketService.addInternalTicketNote).mockImplementationOnce(
      () => new Promise(resolve => { release = resolve }),
    )
    const wrapper = mountActions()
    await wrapper.find('[data-testid="engineer-note-input"]').setValue('Revisar caso')
    await wrapper.get('[data-testid="engineer-add-note"]').trigger('click')
    await wrapper.get('[data-testid="engineer-add-note"]').trigger('click')
    expect(assignedTicketService.addInternalTicketNote).toHaveBeenCalledTimes(1)
    release({})
    await flushPromises()
  })
})
