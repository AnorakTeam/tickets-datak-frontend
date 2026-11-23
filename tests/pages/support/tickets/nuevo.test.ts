import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SupportNuevoTicketPage from '~/pages/support/tickets/nuevo.vue'

const {
  getSupportEmpresasMock,
  createExternalTicketMock,
  mockPush,
  mockAddToast,
} = vi.hoisted(() => ({
  getSupportEmpresasMock: vi.fn(),
  createExternalTicketMock: vi.fn(),
  mockPush: vi.fn(),
  mockAddToast: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('~/services/supportTicketService', () => ({
  supportTicketService: {
    getSupportEmpresas: getSupportEmpresasMock,
    createExternalTicket: createExternalTicketMock,
  },
}))

global.useToast = () => ({
  add: mockAddToast,
})
global.useHead = vi.fn()
global.definePageMeta = vi.fn()

const mockModules = [
  { id: 10, codigo: 'MOD-FAC', nombre: 'Facturación Electrónica' },
  { id: 11, codigo: 'MOD-NOM', nombre: 'Nómina y Recursos Humanos' },
]

const mockEmpresas = [
  { id: 1, nombre: 'Empresa Alpha', modulos_contratados: mockModules },
  { id: 2, nombre: 'Empresa Beta', modulos: [] },
]

const globalStubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
  UFormGroup: {
    props: ['label', 'required', 'error', 'help'],
    template: `
      <div class="u-form-group" :data-label="label" :data-error="error">
        <label v-if="label">{{ label }}</label>
        <slot />
        <span v-if="error" class="error-msg text-red-500">{{ error }}</span>
      </div>
    `,
  },
  UInput: {
    name: 'UInput',
    props: ['modelValue', 'placeholder', 'disabled', 'maxlength'],
    emits: ['update:modelValue'],
    template: `
      <input
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
  UTextarea: {
    name: 'UTextarea',
    props: ['modelValue', 'placeholder', 'disabled', 'rows'],
    emits: ['update:modelValue'],
    template: `
      <textarea
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
  UButton: {
    props: ['type', 'disabled', 'loading', 'color', 'variant', 'icon', 'to'],
    template: `
      <button :type="type || 'button'" :disabled="disabled || loading">
        <slot />
      </button>
    `,
  },
  UIcon: {
    props: ['name'],
    template: '<i :class="name" />',
  },
  RadicadoModal: {
    props: ['modelValue', 'radicado', 'asunto', 'modulo', 'mensaje'],
    emits: ['update:modelValue', 'close'],
    template: `
      <div v-if="modelValue" class="radicado-modal-stub" :data-radicado="radicado">
        <span>{{ radicado }}</span>
        <span>{{ asunto }}</span>
        <span>{{ modulo }}</span>
        <button class="close-modal-btn" @click="$emit('close')">Cerrar</button>
      </div>
    `,
  },
}

const mountPage = () => mount(SupportNuevoTicketPage, {
  global: { stubs: globalStubs },
})

describe('Support Nuevo Ticket Page (FE-17)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSupportEmpresasMock.mockResolvedValue(mockEmpresas)
  })

  it('protects route with support middleware and loads companies on mount', async () => {
    mountPage()
    await flushPromises()

    expect(global.definePageMeta).toHaveBeenCalledWith({ middleware: 'support' })
    expect(getSupportEmpresasMock).toHaveBeenCalledOnce()
  })

  it('loads dynamic modules from selected client company without extra requests', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Seleccione primero una empresa cliente')

    const empresaSelect = wrapper.find('select[aria-label="Seleccionar empresa cliente"]')
    await empresaSelect.setValue('1')
    await flushPromises()

    expect(wrapper.find('select[aria-label="Seleccionar módulo afectado"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Facturación Electrónica (MOD-FAC)')
  })

  it('validates required fields and shows error messages on empty submit', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(createExternalTicketMock).not.toHaveBeenCalled()
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Formulario incompleto',
        color: 'red',
      }),
    )

    expect(wrapper.text()).toContain('Debe seleccionar la empresa cliente que reporta el incidente.')
  })

  it('submits external ticket and opens RadicadoModal on success', async () => {
    createExternalTicketMock.mockResolvedValue({
      id: 99,
      radicado: 'TK-2026-000099',
      estado: 'Abierto',
      fecha_creacion: '2026-11-17T12:00:00Z',
      asunto: 'Error grave en liquidación de nómina',
      modulo: { id: 11, nombre: 'Nómina y Recursos Humanos' },
      empresa: { id: 1, nombre: 'Empresa Alpha' },
      canal_origen: 'WhatsApp',
      mensaje: 'Ticket externo registrado con éxito.',
    })

    const wrapper = mountPage()
    await flushPromises()

    // 1. Select empresa
    const empresaSelect = wrapper.find('select[aria-label="Seleccionar empresa cliente"]')
    await empresaSelect.setValue('1')
    await flushPromises()

    // 2. Select modulo
    const moduloSelect = wrapper.find('select[aria-label="Seleccionar módulo afectado"]')
    await moduloSelect.setValue('11')
    await flushPromises()

    // 3. Channel is WhatsApp by default

    // 4. Input screen
    const screenInput = wrapper.findAllComponents({ name: 'UInput' })[0]
    await screenInput.vm.$emit('update:modelValue', 'Módulo de Nómina Quincenal')

    // 5. Input asunto
    const asuntoInput = wrapper.findAllComponents({ name: 'UInput' })[1]
    await asuntoInput.vm.$emit('update:modelValue', 'Error grave en liquidación de nómina')

    // 6. Input descripcion (> 15 chars)
    const descTextarea = wrapper.findComponent({ name: 'UTextarea' })
    await descTextarea.vm.$emit(
      'update:modelValue',
      'El cliente informa por WhatsApp que no calcula retención en la fuente.',
    )

    // Submit form
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(createExternalTicketMock).toHaveBeenCalledWith(
      expect.objectContaining({
        empresa_id: 1,
        modulo_id: 11,
        canal_origen: 'WhatsApp',
        pestana_o_documento: 'Módulo de Nómina Quincenal',
        asunto: 'Error grave en liquidación de nómina',
        descripcion: 'El cliente informa por WhatsApp que no calcula retención en la fuente.',
        prioridad: 'Media',
      }),
    )

    expect(wrapper.find('.radicado-modal-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('TK-2026-000099')

    // Close modal -> redirects to /support/tickets
    await wrapper.find('.close-modal-btn').trigger('click')
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/support/tickets')
  })
})
