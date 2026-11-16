import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ChatbotWidget from '~/components/chatbot/ChatbotWidget.vue'
import { chatbotService, type ChatbotMessageResponse } from '~/services/chatbotService'

global.useToast = () => ({
  add: vi.fn(),
})

const globalStubs = {
  UIcon: {
    props: ['name'],
    template: '<i :class="name" />',
  },
  UBadge: {
    props: ['color', 'variant', 'size'],
    template: '<span class="u-badge"><slot /></span>',
  },
  Transition: {
    template: '<div><slot /></div>',
  },
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
  UButton: {
    props: ['size', 'color', 'variant', 'icon', 'disabled'],
    template: '<button :disabled="disabled"><slot /></button>',
  },
}

describe('ChatbotWidget.vue (FE-10 / RF3, RF6)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders floating action button and starts closed by default', () => {
    const wrapper = mount(ChatbotWidget, {
      global: { stubs: globalStubs },
    })

    const toggleBtn = wrapper.find('[data-testid="chatbot-toggle-btn"]')
    expect(toggleBtn.exists()).toBe(true)
    expect(wrapper.find('[data-testid="chatbot-drawer"]').exists()).toBe(false)
  })

  it('opens drawer on toggle click and displays welcome message and online status', async () => {
    const wrapper = mount(ChatbotWidget, {
      global: { stubs: globalStubs },
    })

    const toggleBtn = wrapper.find('[data-testid="chatbot-toggle-btn"]')
    await toggleBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="chatbot-drawer"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Asistente Virtual Datak')
    expect(wrapper.text()).toContain('En línea · Soporte 24/7')
    expect(wrapper.text()).toContain('Soy tu asistente virtual de Tickets Datak')

    // Quick action chips exist
    expect(wrapper.text()).toContain('Reportar un problema')
    expect(wrapper.text()).toContain('Consultar radicado')
  })

  it('sends user message and displays bot response', async () => {
    const mockBotResponse: ChatbotMessageResponse = {
      session_id: 'session-xyz',
      tipo_respuesta: 'PREGUNTA',
      mensaje: '¿Cuál es el código o nombre del módulo contratado que presenta la falla?',
    }

    vi.spyOn(chatbotService, 'sendChatbotMessage').mockResolvedValue(mockBotResponse)

    const wrapper = mount(ChatbotWidget, {
      props: { initialOpen: true },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    const input = wrapper.find('[data-testid="chatbot-input"]')
    await input.setValue('Tengo un error en el sistema')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    // Check user message is displayed
    const userMessages = wrapper.findAll('[data-testid="message-user"]')
    expect(userMessages.length).toBe(1)
    expect(userMessages[0].text()).toContain('Tengo un error en el sistema')

    await flushPromises()

    // Check bot response is displayed
    const botMessages = wrapper.findAll('[data-testid="message-bot"]')
    expect(botMessages.length).toBe(2) // Welcome + Response
    expect(botMessages[1].text()).toContain('¿Cuál es el código o nombre del módulo contratado')
  })

  it('sends message when clicking quick suggestion chip', async () => {
    const mockBotResponse: ChatbotMessageResponse = {
      session_id: 'session-xyz',
      tipo_respuesta: 'PREGUNTA',
      mensaje: 'Indique el radicado a consultar',
    }

    vi.spyOn(chatbotService, 'sendChatbotMessage').mockResolvedValue(mockBotResponse)

    const wrapper = mount(ChatbotWidget, {
      props: { initialOpen: true },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    const quickButtons = wrapper.findAll('button')
    const consultChip = quickButtons.find((btn) => btn.text().includes('Consultar radicado'))
    expect(consultChip).toBeDefined()

    await consultChip!.trigger('click')
    await flushPromises()

    expect(chatbotService.sendChatbotMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        mensaje: 'Quiero consultar el estado de un radicado',
      })
    )
  })

  it('emits ticket-created event when bot completes incident creation', async () => {
    const mockCreatedResponse: ChatbotMessageResponse = {
      session_id: 'session-xyz',
      tipo_respuesta: 'TICKET_CREADO',
      radicado: 'TK-2026-000099',
      mensaje: '¡Listo! Tu ticket ha sido creado con el radicado TK-2026-000099.',
    }

    vi.spyOn(chatbotService, 'sendChatbotMessage').mockResolvedValue(mockCreatedResponse)

    const wrapper = mount(ChatbotWidget, {
      props: { initialOpen: true },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    const input = wrapper.find('[data-testid="chatbot-input"]')
    await input.setValue('Confirmar y radicar')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.emitted('ticket-created')).toBeTruthy()
    expect(wrapper.emitted('ticket-created')![0]).toEqual(['TK-2026-000099'])
    expect(wrapper.text()).toContain('TK-2026-000099')
  })

  it('resets conversation when clicking reset button', async () => {
    vi.spyOn(chatbotService, 'sendChatbotMessage').mockResolvedValue({
      session_id: 'session-xyz',
      tipo_respuesta: 'INFO',
      mensaje: 'Respuesta previa',
    })

    const wrapper = mount(ChatbotWidget, {
      props: { initialOpen: true },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    // Add user message
    const input = wrapper.find('[data-testid="chatbot-input"]')
    await input.setValue('Mensaje previo')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    // Click reset
    const resetBtn = wrapper.find('[data-testid="chatbot-reset-btn"]')
    await resetBtn.trigger('click')
    await flushPromises()

    // Should only have initial welcome message
    const botMessages = wrapper.findAll('[data-testid="message-bot"]')
    expect(botMessages.length).toBe(1)
    expect(wrapper.findAll('[data-testid="message-user"]').length).toBe(0)
  })

  it('renders interactive summary card and handles confirmation (FE-11)', async () => {
    const mockSummaryResponse: ChatbotMessageResponse = {
      session_id: 'session-xyz',
      tipo_respuesta: 'RESUMEN',
      mensaje: 'Por favor revisa el resumen de tu reporte antes de crearlo:',
      campos_recolectados: {
        modulo_nombre: 'Facturación Electrónica',
        pantalla: 'Factura F-203',
        asunto: 'Error 500 al emitir factura',
        descripcion: 'El sistema no timbra y lanza error de servidor.',
      },
    }

    vi.spyOn(chatbotService, 'sendChatbotMessage').mockResolvedValue(mockSummaryResponse)

    const wrapper = mount(ChatbotWidget, {
      props: { initialOpen: true },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    const input = wrapper.find('[data-testid="chatbot-input"]')
    await input.setValue('Ya terminé de explicar el error')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('[data-testid="chatbot-summary-card"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Resumen de la Incidencia a Radicar')
    expect(wrapper.text()).toContain('Facturación Electrónica')

    // Click confirmation button in summary card
    const confirmBtn = wrapper.find('[data-testid="summary-confirm-btn"]')
    expect(confirmBtn.exists()).toBe(true)

    vi.spyOn(chatbotService, 'sendChatbotMessage').mockResolvedValue({
      session_id: 'session-xyz',
      tipo_respuesta: 'TICKET_CREADO',
      radicado: 'TK-2026-000105',
      mensaje: 'Ticket creado exitosamente.',
    })

    await confirmBtn.trigger('click')
    await flushPromises()

    expect(chatbotService.sendChatbotMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        mensaje: 'Sí, confirmar y radicar ticket',
      })
    )
  })

  it('renders radicado confirmation card with one-click copy button on ticket creation (FE-11)', async () => {
    const mockCreatedResponse: ChatbotMessageResponse = {
      session_id: 'session-xyz',
      tipo_respuesta: 'TICKET_CREADO',
      radicado: 'TK-2026-000777',
      mensaje: 'He creado tu ticket con el radicado TK-2026-000777.',
    }

    vi.spyOn(chatbotService, 'sendChatbotMessage').mockResolvedValue(mockCreatedResponse)

    const wrapper = mount(ChatbotWidget, {
      props: { initialOpen: true },
      global: { stubs: globalStubs },
    })

    await flushPromises()

    const input = wrapper.find('[data-testid="chatbot-input"]')
    await input.setValue('Confirmar')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('[data-testid="chatbot-radicado-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chatbot-radicado-number"]').text()).toBe('TK-2026-000777')
    expect(wrapper.find('[data-testid="chatbot-copy-radicado-btn"]').exists()).toBe(true)
  })
})
