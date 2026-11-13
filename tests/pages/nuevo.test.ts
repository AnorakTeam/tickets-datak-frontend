import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import NuevoTicketPage from '~/pages/tickets/nuevo.vue'
import { ticketService } from '~/services/ticketService'

// Global Nuxt helpers mock
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockAddToast = vi.fn()
global.useToast = () => ({
  add: mockAddToast,
})
global.useHead = vi.fn()

const globalStubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
  UCard: {
    template: '<div class="u-card"><slot /></div>',
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
    props: ['modelValue', 'placeholder', 'disabled', 'maxlength', 'size', 'icon'],
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
  USelectMenu: {
    props: ['modelValue', 'options', 'placeholder', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <select
        :value="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-for="opt in options" :key="opt.value || opt.id" :value="opt.value || opt.id">
          {{ opt.label || opt.nombre }}
        </option>
      </select>
    `,
  },
  UButton: {
    props: ['type', 'color', 'variant', 'size', 'disabled', 'loading', 'icon'],
    template: `
      <button :type="type || 'button'" :disabled="disabled">
        <slot />
      </button>
    `,
  },
  UAlert: {
    props: ['title', 'description', 'color', 'icon', 'variant'],
    template: '<div class="u-alert" :data-title="title">{{ title }} - {{ description }}</div>',
  },
  UIcon: {
    props: ['name'],
    template: '<i :class="name" />',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
  ModuleSelect: {
    name: 'ModuleSelect',
    props: ['modelValue', 'label', 'error', 'required', 'disabled'],
    emits: ['update:modelValue', 'empty'],
    template: `
      <div class="module-select-mock" :data-error="error">
        <label v-if="label">{{ label }}</label>
        <select
          :value="modelValue"
          @change="$emit('update:modelValue', Number($event.target.value))"
        >
          <option value="">Seleccione módulo...</option>
          <option :value="10">Facturación Electrónica</option>
        </select>
        <span v-if="error" class="error-msg text-red-500">{{ error }}</span>
      </div>
    `,
  },
}

describe('Incident Report Form Page (/tickets/nuevo — FE-06)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
    mockAddToast.mockReset()
  })

  it('renders the form title and all input fields in Spanish', () => {
    const wrapper = mount(NuevoTicketPage, {
      global: { stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('Reportar Nueva Incidencia')
    expect(wrapper.text()).toContain('Módulo contratado afectado')
    expect(wrapper.text()).toContain('Nivel de prioridad estimado')
    expect(wrapper.text()).toContain('Pantalla, ventana o documento afectado')
    expect(wrapper.text()).toContain('Asunto o resumen breve de la incidencia')
    expect(wrapper.text()).toContain('Descripción detallada del problema')
    expect(wrapper.text()).toContain('Mensaje o código de error del sistema')
  })

  it('validates mandatory fields and displays error messages on submit when empty', async () => {
    const wrapper = mount(NuevoTicketPage, {
      global: { stubs: globalStubs },
    })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    const errorMessages = wrapper.findAll('.error-msg').map((el) => el.text())
    expect(errorMessages).toContain('Debe seleccionar el módulo de software afectado.')
    expect(errorMessages).toContain('Indique la pantalla, vista o documento donde ocurrió el incidente.')
    expect(errorMessages).toContain('El asunto o título del incidente es obligatorio.')
    expect(errorMessages).toContain('La descripción detallada del problema es obligatoria.')

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Formulario incompleto',
        color: 'red',
      })
    )
  })

  it('validates that description has minimum 15 characters', async () => {
    const wrapper = mount(NuevoTicketPage, {
      global: { stubs: globalStubs },
    })

    // Fill inputs but description with too few chars
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Facturación / F-100') // screen
    await inputs[1].setValue('Error al facturar') // subject

    const textareas = wrapper.findAll('textarea')
    await textareas[0].setValue('Muy corto') // description < 15 chars

    await wrapper.find('.module-select-mock select').setValue('10') // module

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Por favor proporcione una descripción más detallada (mínimo 15 caracteres).')
  })

  it('disables submit button and shows warning alert when company has no contracted modules', async () => {
    const wrapper = mount(NuevoTicketPage, {
      global: { stubs: globalStubs },
    })

    // Simulate ModuleSelect emitting empty: true
    const moduleSelect = wrapper.findComponent({ name: 'ModuleSelect' })
    moduleSelect.vm.$emit('empty', true)
    await flushPromises()

    expect(wrapper.find('.u-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('Atención: No puede radicar incidencias')

    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('submits valid form data, calls ticketService.createTicket, and redirects on success', async () => {
    const mockCreatedResponse = {
      radicado: 'TK-2026-000001',
      estado: 'Abierto' as const,
      fecha_creacion: '2026-11-12T10:00:00Z',
      asunto: 'Error 500 al timbrar factura',
      modulo: { id: 10, nombre: 'Facturación Electrónica' },
      mensaje: 'Incidencia radicada exitosamente',
    }

    vi.spyOn(ticketService, 'createTicket').mockResolvedValue(mockCreatedResponse)

    const wrapper = mount(NuevoTicketPage, {
      global: { stubs: globalStubs },
    })

    // Select module
    await wrapper.find('.module-select-mock select').setValue('10')

    // Fill screen and subject
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Facturación / Factura F-203')
    await inputs[1].setValue('Error 500 al timbrar factura con retención')

    // Fill description and error
    const textareas = wrapper.findAll('textarea')
    await textareas[0].setValue('Al intentar timbrar la factura para el cliente XYZ, el sistema se queda cargando y arroja error.')
    await textareas[1].setValue('Server Error: RetencionCalculatorException line 42')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(ticketService.createTicket).toHaveBeenCalledWith({
      modulo_id: 10,
      pestana_o_documento: 'Facturación / Factura F-203',
      asunto: 'Error 500 al timbrar factura con retención',
      descripcion: 'Al intentar timbrar la factura para el cliente XYZ, el sistema se queda cargando y arroja error.',
      mensaje_error: 'Server Error: RetencionCalculatorException line 42',
      prioridad: 'Media',
    })

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '¡Incidencia radicada!',
        description: 'Radicado generado exitosamente: TK-2026-000001',
        color: 'green',
      })
    )

    expect(mockPush).toHaveBeenCalledWith('/tickets')
  })
})
