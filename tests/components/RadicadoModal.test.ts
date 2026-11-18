import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RadicadoModal from '~/components/tickets/RadicadoModal.vue'

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

const globalStubs = {
  UModal: {
    name: 'UModal',
    props: ['modelValue', 'preventClose'],
    emits: ['update:modelValue'],
    template: `
      <div v-if="modelValue" class="u-modal-stub" data-testid="radicado-modal">
        <slot />
      </div>
    `,
  },
  UCard: {
    template: '<div class="u-card-stub"><slot name="header" /><slot /><slot name="footer" /></div>',
  },
  UButton: {
    props: ['size', 'color', 'variant', 'icon'],
    template: '<button class="u-button-stub" type="button"><slot /></button>',
  },
  UIcon: {
    props: ['name'],
    template: '<i :class="name" />',
  },
}

describe('RadicadoModal.vue (FE-07 / AGENTS.md Rule 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
    mockAddToast.mockReset()

    // Default mock clipboard available
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    })
  })

  it('renders modal with formatted radicado number and confirmation copy in Spanish', () => {
    const wrapper = mount(RadicadoModal, {
      props: {
        modelValue: true,
        radicado: 'TK-2026-000042',
        asunto: 'Error 500 en Facturación',
        moduloNombre: 'Facturación Electrónica',
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('[data-testid="radicado-modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('¡Incidencia Radicada Exitosamente!')
    expect(wrapper.text()).toContain('TK-2026-000042')
    expect(wrapper.text()).toContain('Facturación Electrónica')
    expect(wrapper.text()).toContain('Error 500 en Facturación')
    expect(wrapper.find('[data-testid="copy-radicado-btn"]').exists()).toBe(true)
  })

  it('copies radicado to clipboard on click and shows feedback when Clipboard API is available', async () => {
    const wrapper = mount(RadicadoModal, {
      props: {
        modelValue: true,
        radicado: 'TK-2026-000042',
      },
      global: { stubs: globalStubs },
    })

    const copyBtn = wrapper.find('[data-testid="copy-radicado-btn"]')
    await copyBtn.trigger('click')
    await flushPromises()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TK-2026-000042')
    expect(wrapper.emitted('copied')).toBeTruthy()
    expect(wrapper.emitted('copied')![0]).toEqual(['TK-2026-000042'])
    expect(copyBtn.text()).toContain('¡Copiado!')
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Radicado copiado',
        color: 'green',
      })
    )
  })

  it('handles unavailable Clipboard API gracefully without indicating copied', async () => {
    // Simulate clipboard API missing
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const wrapper = mount(RadicadoModal, {
      props: {
        modelValue: true,
        radicado: 'TK-2026-000042',
      },
      global: { stubs: globalStubs },
    })

    const copyBtn = wrapper.find('[data-testid="copy-radicado-btn"]')
    await copyBtn.trigger('click')
    await flushPromises()

    // Must NOT emit copied event and button text must NOT say '¡Copiado!'
    expect(wrapper.emitted('copied')).toBeFalsy()
    expect(copyBtn.text()).not.toContain('¡Copiado!')
    expect(copyBtn.text()).toContain('Copiar Radicado')

    // Warning toast must be displayed
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Portapapeles no disponible',
        color: 'amber',
      })
    )
  })

  it('handles clipboard writeText rejection gracefully without indicating copied', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
      writable: true,
      configurable: true,
    })

    const wrapper = mount(RadicadoModal, {
      props: {
        modelValue: true,
        radicado: 'TK-2026-000042',
      },
      global: { stubs: globalStubs },
    })

    const copyBtn = wrapper.find('[data-testid="copy-radicado-btn"]')
    await copyBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('copied')).toBeFalsy()
    expect(copyBtn.text()).not.toContain('¡Copiado!')
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error al copiar',
        color: 'amber',
      })
    )
  })

  it('navigates to tickets dashboard as single authority and emits redirect without duplicate close', async () => {
    const wrapper = mount(RadicadoModal, {
      props: {
        modelValue: true,
        radicado: 'TK-2026-000042',
        redirectPath: '/tickets',
      },
      global: { stubs: globalStubs },
    })

    const redirectBtn = wrapper.find('[data-testid="modal-redirect-btn"]')
    await redirectBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('redirect')).toBeTruthy()
    expect(wrapper.emitted('redirect')![0]).toEqual(['/tickets'])
    expect(wrapper.emitted('close')).toBeFalsy() // Prevents duplicate navigation in parent
    expect(mockPush).toHaveBeenCalledWith('/tickets')
  })

  it('emits close event when clicking close button', async () => {
    const wrapper = mount(RadicadoModal, {
      props: {
        modelValue: true,
        radicado: 'TK-2026-000042',
      },
      global: { stubs: globalStubs },
    })

    const closeBtn = wrapper.find('[data-testid="modal-close-btn"]')
    await closeBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('follows the exact same close flow when closed via backdrop or Escape key', async () => {
    const wrapper = mount(RadicadoModal, {
      props: {
        modelValue: true,
        radicado: 'TK-2026-000042',
      },
      global: { stubs: globalStubs },
    })

    const uModal = wrapper.findComponent({ name: 'UModal' })
    // Simulate UModal emitting update:modelValue: false (backdrop or Escape)
    uModal.vm.$emit('update:modelValue', false)
    await flushPromises()

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })
})
