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
global.definePageMeta = vi.fn()

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
    emits: ['update:modelValue', 'blur'],
    template: `
      <input
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      />
    `,
  },
  UTextarea: {
    props: ['modelValue', 'placeholder', 'disabled', 'rows'],
    emits: ['update:modelValue', 'blur'],
    template: `
      <textarea
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
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
    emits: ['update:modelValue', 'empty', 'error', 'loaded'],
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
  RadicadoModal: {
    name: 'RadicadoModal',
    props: ['modelValue', 'radicado', 'asunto', 'moduloNombre', 'mensaje'],
    emits: ['update:modelValue', 'close'],
    template: `
      <div v-if="modelValue" class="radicado-modal-mock" :data-radicado="radicado">
        <span>{{ radicado }}</span>
        <button class="close-modal-mock-btn" @click="$emit('close')">Cerrar</button>
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

  it('clears specific field error in real-time when the user corrects the input', async () => {
    const wrapper = mount(NuevoTicketPage, {
      global: { stubs: globalStubs },
    })

    // Submit while empty to trigger all validation errors
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('El asunto o título del incidente es obligatorio.')
    expect(wrapper.text()).toContain('La descripción detallada del problema es obligatoria.')

    // Correct the subject field
    const inputs = wrapper.findAll('input')
    await inputs[1].setValue('Error al timbrar factura electrónica')
    await flushPromises()

    // Error for subject is cleared immediately in real time
    expect(wrapper.text()).not.toContain('El asunto o título del incidente es obligatorio.')
    // Description error is still present
    expect(wrapper.text()).toContain('La descripción detallada del problema es obligatoria.')

    // Correct the description field with >= 15 chars
    const textareas = wrapper.findAll('textarea')
    await textareas[0].setValue('Descripción completa y detallada de más de quince caracteres')
    await flushPromises()

    // Description error is cleared in real time
    expect(wrapper.text()).not.toContain('La descripción detallada del problema es obligatoria.')
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

  it('clearly separates module network connection error from genuine company without modules', async () => {
    const wrapper = mount(NuevoTicketPage, {
      global: { stubs: globalStubs },
    })

    const moduleSelect = wrapper.findComponent({ name: 'ModuleSelect' })

    // Case 1: Network error occurs while loading modules
    moduleSelect.vm.$emit('error', '500 Server Error')
    await flushPromises()

    // Must show network error alert
    expect(wrapper.text()).toContain('Fallo de conexión con el catálogo de módulos')
    expect(wrapper.text()).toContain('500 Server Error')
    // Must NOT declare the company has no modules
    expect(wrapper.text()).not.toContain('Atención: No puede radicar incidencias')

    // Case 2: Company genuinely has 0 modules
    moduleSelect.vm.$emit('empty', true)
    await flushPromises()

    // Must show the amber alert for company without modules
    expect(wrapper.text()).toContain('Atención: No puede radicar incidencias')
    expect(wrapper.text()).toContain('Su empresa no registra módulos de software contratados activos')
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

    // Verify modal is open with formatted radicado
    expect(wrapper.find('.radicado-modal-mock').exists()).toBe(true)
    expect(wrapper.find('.radicado-modal-mock').text()).toContain('TK-2026-000001')

    // Close modal triggers navigation
    await wrapper.find('.close-modal-mock-btn').trigger('click')
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/tickets')
  })
})
