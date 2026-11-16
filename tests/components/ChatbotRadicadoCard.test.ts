import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ChatbotRadicadoCard from '~/components/chatbot/ChatbotRadicadoCard.vue'

const mockAddToast = vi.fn()
global.useToast = () => ({
  add: mockAddToast,
})

const globalStubs = {
  UIcon: {
    props: ['name'],
    template: '<i :class="name" />',
  },
  UButton: {
    props: ['size', 'color', 'variant', 'icon'],
    template: '<button><slot /></button>',
  },
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}

describe('ChatbotRadicadoCard.vue (FE-11 / AGENTS.md Rule 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockAddToast.mockReset()

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    })
  })

  it('renders radicado number and confirmation message', () => {
    const wrapper = mount(ChatbotRadicadoCard, {
      props: {
        radicado: 'TK-2026-000100',
        mensaje: 'Tu ticket ha sido creado satisfactoriamente.',
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('[data-testid="chatbot-radicado-card"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Ticket Radicado Exitosamente')
    expect(wrapper.text()).toContain('TK-2026-000100')
    expect(wrapper.text()).toContain('Tu ticket ha sido creado satisfactoriamente.')
  })

  it('copies radicado on click and displays feedback', async () => {
    const wrapper = mount(ChatbotRadicadoCard, {
      props: {
        radicado: 'TK-2026-000100',
      },
      global: { stubs: globalStubs },
    })

    const copyBtn = wrapper.find('[data-testid="chatbot-copy-radicado-btn"]')
    await copyBtn.trigger('click')
    await flushPromises()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TK-2026-000100')
    expect(wrapper.emitted('copied')).toBeTruthy()
    expect(wrapper.emitted('copied')![0]).toEqual(['TK-2026-000100'])
    expect(copyBtn.text()).toContain('¡Copiado!')
  })
})
