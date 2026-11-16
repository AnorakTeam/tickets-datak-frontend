import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatbotStatusCard from '~/components/chatbot/ChatbotStatusCard.vue'

const globalStubs = {
  UIcon: {
    props: ['name'],
    template: '<i :class="name" />',
  },
  UBadge: {
    props: ['color', 'variant', 'size'],
    template: '<span class="u-badge" :data-color="color"><slot /></span>',
  },
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}

describe('ChatbotStatusCard.vue (FE-12 / RF6)', () => {
  it('renders status card for ticket "En gestion" with module and subject', () => {
    const wrapper = mount(ChatbotStatusCard, {
      props: {
        radicado: 'TK-2026-000001',
        datos: {
          estado: 'En gestion',
          asunto: 'Error 500 al timbrar factura',
          modulo: 'Facturación Electrónica',
          fecha_creacion: '2026-11-09T18:30:00Z',
        },
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('[data-testid="chatbot-status-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="status-radicado"]').text()).toBe('TK-2026-000001')
    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('En Gestión')
    expect(wrapper.find('[data-testid="status-asunto"]').text()).toBe('Error 500 al timbrar factura')
    expect(wrapper.find('[data-testid="status-modulo"]').text()).toBe('Facturación Electrónica')
    expect(wrapper.find('[data-testid="view-ticket-detail-link"]').attributes('href')).toBe('/tickets/TK-2026-000001')
  })

  it('renders solution comment when ticket state is "Resuelto"', () => {
    const wrapper = mount(ChatbotStatusCard, {
      props: {
        radicado: 'TK-2026-000002',
        datos: {
          estado: 'Resuelto',
          asunto: 'Problema de cálculo de retención',
          modulo: 'Facturación Electrónica',
          comentario_solucion: 'Se ajustó la regla de validación de retenciones en base de datos.',
        },
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('Resuelto')
    const solution = wrapper.find('[data-testid="solution-comment"]')
    expect(solution.exists()).toBe(true)
    expect(solution.text()).toContain('Se ajustó la regla de validación de retenciones')
  })

  it('renders reason when ticket is marked "No procedente"', () => {
    const wrapper = mount(ChatbotStatusCard, {
      props: {
        radicado: 'TK-2026-000003',
        datos: {
          estado: 'No procedente',
          asunto: 'Error al iniciar sesión',
          motivo_no_procedente: 'El usuario estaba ingresando una contraseña incorrecta.',
        },
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('[data-testid="status-badge"]').text()).toContain('No Procedente')
    const noProcedente = wrapper.find('[data-testid="no-procedente-comment"]')
    expect(noProcedente.exists()).toBe(true)
    expect(noProcedente.text()).toContain('El usuario estaba ingresando una contraseña incorrecta.')
  })
})
