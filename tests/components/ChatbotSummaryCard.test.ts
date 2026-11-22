import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatbotSummaryCard from '~/components/chatbot/ChatbotSummaryCard.vue'

const globalStubs = {
  UIcon: {
    props: ['name'],
    template: '<i :class="name" />',
  },
  UButton: {
    props: ['size', 'color', 'variant', 'icon', 'disabled'],
    template: '<button :disabled="disabled"><slot /></button>',
  },
}

describe('ChatbotSummaryCard.vue (FE-11)', () => {
  it('renders collected fields in Spanish in structured card format', () => {
    const campos = {
      modulo_nombre: 'Facturación Electrónica',
      pantalla: 'Emisión de Factura F-203',
      asunto: 'Error 500 al timbrar factura',
      descripcion: 'El sistema se queda cargando y lanza una excepción de servidor.',
    }

    const wrapper = mount(ChatbotSummaryCard, {
      props: { campos },
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('[data-testid="chatbot-summary-card"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Resumen de la Incidencia a Radicar')
    expect(wrapper.text()).toContain('Facturación Electrónica')
    expect(wrapper.text()).toContain('Emisión de Factura F-203')
    expect(wrapper.text()).toContain('Error 500 al timbrar factura')
    expect(wrapper.text()).toContain('El sistema se queda cargando')
  })

  it('emits confirm when clicking confirm and submit button', async () => {
    const wrapper = mount(ChatbotSummaryCard, {
      props: { campos: { modulo: 'INVENTARIO' } },
      global: { stubs: globalStubs },
    })

    const confirmBtn = wrapper.find('[data-testid="summary-confirm-btn"]')
    await confirmBtn.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel when clicking correct/cancel button', async () => {
    const wrapper = mount(ChatbotSummaryCard, {
      props: { campos: { modulo: 'INVENTARIO' } },
      global: { stubs: globalStubs },
    })

    const cancelBtn = wrapper.find('[data-testid="summary-cancel-btn"]')
    await cancelBtn.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
