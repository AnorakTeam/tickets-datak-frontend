import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatbotActiveTicketsCard from '~/components/chatbot/ChatbotActiveTicketsCard.vue'

const globalStubs = {
  UIcon: {
    template: '<span class="ui-icon" :data-name="$attrs.name"></span>',
  },
  UBadge: {
    template: '<span class="u-badge"><slot /></span>',
  },
}

describe('ChatbotActiveTicketsCard.vue (FE-12 / RF6)', () => {
  const mockTickets = [
    {
      radicado: 'TK-2026-000001',
      asunto: 'Error 500 al emitir factura',
      modulo: 'Facturación Electrónica',
      estado: 'En gestión',
    },
    {
      radicado: 'TK-2026-000002',
      asunto: 'Discrepancia en kardex',
      modulo: 'Inventarios',
      estado: 'Abierto',
    },
  ]

  it('renders list of active tickets with radicado, status, and details', () => {
    const wrapper = mount(ChatbotActiveTicketsCard, {
      props: { tickets: mockTickets },
      global: { stubs: globalStubs },
    })

    expect(wrapper.find('[data-testid="chatbot-active-tickets-card"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Tickets Activos')
    expect(wrapper.text()).toContain('2 tickets')

    const ticketItems = wrapper.findAll('[data-testid="active-ticket-item"]')
    expect(ticketItems.length).toBe(2)
    expect(ticketItems[0].text()).toContain('TK-2026-000001')
    expect(ticketItems[0].text()).toContain('Error 500 al emitir factura')
    expect(ticketItems[0].text()).toContain('Facturación Electrónica')
    expect(ticketItems[1].text()).toContain('TK-2026-000002')
  })

  it('emits select event with ticket radicado when item card is clicked', async () => {
    const wrapper = mount(ChatbotActiveTicketsCard, {
      props: { tickets: mockTickets },
      global: { stubs: globalStubs },
    })

    const ticketItems = wrapper.findAll('[data-testid="active-ticket-item"]')
    await ticketItems[0].trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['TK-2026-000001'])
  })

  it('renders quick selection chips when more than 1 ticket exists and emits select on chip click', async () => {
    const wrapper = mount(ChatbotActiveTicketsCard, {
      props: { tickets: mockTickets },
      global: { stubs: globalStubs },
    })

    const chip1 = wrapper.find('[data-testid="chip-select-ticket-TK-2026-000001"]')
    expect(chip1.exists()).toBe(true)
    await chip1.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['TK-2026-000001'])
  })
})
