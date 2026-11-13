import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ModuleSelect from '~/components/tickets/ModuleSelect.vue'
import { moduleService, type ContractedModule } from '~/services/moduleService'

const mockModules: ContractedModule[] = [
  { id: 10, codigo: 'FACTURACION', nombre: 'Facturación Electrónica' },
  { id: 11, codigo: 'INVENTARIO', nombre: 'Control de Inventarios' },
  { id: 12, codigo: 'NOMINA', nombre: 'Nómina y RRHH' },
]

const globalStubs = {
  UFormGroup: {
    props: ['label', 'required', 'error', 'help'],
    template: '<div class="u-form-group" :data-label="label"><slot /></div>',
  },
  USkeleton: {
    template: '<div class="u-skeleton" data-testid="skeleton" />',
  },
  UAlert: {
    props: ['title', 'description', 'color', 'icon', 'variant'],
    template: '<div class="u-alert" :data-title="title" :data-description="description"><h3>{{ title }}</h3><p>{{ description }}</p></div>',
  },
  UButton: {
    props: ['color', 'variant', 'size', 'icon'],
    template: '<button class="u-button" type="button"><slot /></button>',
  },
  USelectMenu: {
    props: ['modelValue', 'options', 'placeholder', 'disabled', 'searchable', 'valueAttribute', 'optionAttribute'],
    emits: ['update:modelValue'],
    template: `
      <div class="u-select-menu" :data-disabled="disabled">
        <select
          :value="modelValue"
          :disabled="disabled"
          @change="$emit('update:modelValue', Number($event.target.value))"
        >
          <option value="">{{ placeholder }}</option>
          <option v-for="opt in options" :key="opt.id" :value="opt.id">
            {{ opt.nombre }} ({{ opt.codigo }})
          </option>
        </select>
      </div>
    `,
  },
  UIcon: {
    props: ['name'],
    template: '<i :class="name" />',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
}

describe('ModuleSelect.vue (FE-05 / Issue #18)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially while fetching modules', async () => {
    // Delay resolution to capture loading state
    let resolvePromise: (val: ContractedModule[]) => void
    const pendingPromise = new Promise<ContractedModule[]>((resolve) => {
      resolvePromise = resolve
    })

    vi.spyOn(moduleService, 'getContractedModules').mockReturnValue(pendingPromise)

    const wrapper = mount(ModuleSelect, {
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('[data-testid="module-select-loading"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Cargando módulos contratados...')
    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true)

    // Finish resolving
    resolvePromise!(mockModules)
    await flushPromises()

    expect(wrapper.find('[data-testid="module-select-loading"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="module-select-ready"]').exists()).toBe(true)
  })

  it('populates modules contracted by the user company and emits loaded event', async () => {
    vi.spyOn(moduleService, 'getContractedModules').mockResolvedValue(mockModules)

    const wrapper = mount(ModuleSelect, {
      props: {
        modelValue: null,
      },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="module-select-ready"]').exists()).toBe(true)
    expect(wrapper.emitted('loaded')).toBeTruthy()
    expect(wrapper.emitted('loaded')![0][0]).toEqual(mockModules)
    expect(wrapper.emitted('empty')).toBeTruthy()
    expect(wrapper.emitted('empty')![0][0]).toBe(false)

    // Check options rendered
    const text = wrapper.text()
    expect(text).toContain('Facturación Electrónica')
    expect(text).toContain('Control de Inventarios')
    expect(text).toContain('Nómina y RRHH')
  })

  it('handles empty module state gracefully with warning alert and empty event', async () => {
    vi.spyOn(moduleService, 'getContractedModules').mockResolvedValue([])

    const wrapper = mount(ModuleSelect, {
      global: { stubs: globalStubs },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="module-select-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sin módulos contratados')
    expect(wrapper.text()).toContain('Su empresa no cuenta actualmente con módulos de software activos')
    expect(wrapper.emitted('empty')).toBeTruthy()
    expect(wrapper.emitted('empty')![0][0]).toBe(true)
    expect(wrapper.find('[data-testid="module-select-ready"]').exists()).toBe(false)
  })

  it('displays error state and allows retrying when API fails', async () => {
    vi.spyOn(moduleService, 'getContractedModules')
      .mockRejectedValueOnce(new Error('Network proxy error'))
      .mockResolvedValueOnce(mockModules)

    const wrapper = mount(ModuleSelect, {
      global: { stubs: globalStubs },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="module-select-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Error al cargar módulos')
    expect(wrapper.text()).toContain('Network proxy error')

    // Click retry button
    const retryBtn = wrapper.find('button')
    expect(retryBtn.exists()).toBe(true)
    await retryBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="module-select-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="module-select-ready"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Facturación Electrónica')
  })

  it('emits update:modelValue and change when an option is selected', async () => {
    vi.spyOn(moduleService, 'getContractedModules').mockResolvedValue(mockModules)

    const wrapper = mount(ModuleSelect, {
      props: {
        modelValue: null,
      },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    const select = wrapper.find('select')
    await select.setValue('11')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([11])

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')![0][0]).toEqual(mockModules[1]) // INVENTARIO
  })
})
