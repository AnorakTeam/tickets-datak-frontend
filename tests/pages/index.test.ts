import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import IndexPage from '~/pages/index.vue'

global.useHead = vi.fn()

const stubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
  UBadge: {
    props: ['color', 'variant', 'size'],
    template: '<span><slot /></span>',
  },
  UButton: {
    props: ['to', 'color', 'variant', 'size', 'icon'],
    template: '<a v-if="to" :href="to"><slot /></a><button v-else><slot /></button>',
  },
  UIcon: {
    props: ['name'],
    template: '<i :data-icon="name" />',
  },
}

describe('Home page (/ — index.vue)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome greeting, Lucide icons and navigation links', () => {
    const wrapper = mount(IndexPage, { global: { stubs } })

    expect(wrapper.text()).toContain('Bienvenido al Sistema de Gestión de Tickets')
    expect(wrapper.text()).toContain('Reportar nueva incidencia')
    expect(wrapper.text()).toContain('Consultar mis tickets')
    expect(wrapper.text()).toContain('Reporte guiado')
    expect(wrapper.text()).toContain('Asistente Datak')
    expect(wrapper.text()).toContain('Aislamiento seguro')

    const links = wrapper.findAll('a')
    expect(links.some(l => l.attributes('href') === '/tickets/nuevo')).toBe(true)
    expect(links.some(l => l.attributes('href') === '/tickets')).toBe(true)

    // Verify exclusively Lucide icons
    const icons = wrapper.findAll('i')
    expect(icons.length).toBeGreaterThan(0)
    for (const icon of icons) {
      expect(icon.attributes('data-icon')).toMatch(/^i-lucide-/)
    }
  })
})
