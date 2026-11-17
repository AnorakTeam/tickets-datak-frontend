import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import LoginPage from '~/pages/login.vue'

const { loginMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    login: loginMock,
  }),
}))

const addToastMock = vi.fn()

global.reactive = reactive
global.ref = ref
global.definePageMeta = vi.fn()
global.useHead = vi.fn()
global.useToast = () => ({ add: addToastMock })

const stubs = {
  UCard: {
    template: '<div class="u-card"><slot /></div>',
  },
  UFormGroup: {
    props: ['label', 'name', 'required'],
    template: '<label><span>{{ label }}</span><slot /></label>',
  },
  UInput: {
    props: ['modelValue', 'type', 'autocomplete', 'placeholder', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <input
        :value="modelValue"
        :type="type"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },
  UButton: {
    props: ['type', 'loading', 'disabled'],
    template: '<button :type="type" :disabled="disabled" :data-loading="loading"><slot /></button>',
  },
}

describe('Login page (/login — FE-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Spanish login form without the client layout', () => {
    const wrapper = mount(LoginPage, { global: { stubs } })

    expect(wrapper.text()).toContain('Iniciar sesión')
    expect(wrapper.text()).toContain('Correo electrónico')
    expect(wrapper.text()).toContain('Contraseña')
    expect(wrapper.find('input[type="email"]').attributes('autocomplete')).toBe('email')
    expect(wrapper.find('input[type="password"]').attributes('autocomplete')).toBe('current-password')
    expect(global.definePageMeta).toHaveBeenCalledWith({ layout: false })
  })

  it('requires both credentials before calling the auth store', async () => {
    const wrapper = mount(LoginPage, { global: { stubs } })

    await wrapper.find('form').trigger('submit.prevent')

    expect(loginMock).not.toHaveBeenCalled()
    expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Datos incompletos',
      color: 'red',
    }))
  })

  it('submits trimmed credentials through the auth store', async () => {
    loginMock.mockResolvedValue(undefined)
    const wrapper = mount(LoginPage, { global: { stubs } })

    await wrapper.find('input[type="email"]').setValue('  cliente@datak.co  ')
    await wrapper.find('input[type="password"]').setValue('secret')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(loginMock).toHaveBeenCalledWith('cliente@datak.co', 'secret')
    expect(addToastMock).not.toHaveBeenCalled()
  })

  it('shows a safe error message when authentication fails', async () => {
    loginMock.mockRejectedValue(new Error('Backend details'))
    const wrapper = mount(LoginPage, { global: { stubs } })

    await wrapper.find('input[type="email"]').setValue('cliente@datak.co')
    await wrapper.find('input[type="password"]').setValue('invalid')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(addToastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'No fue posible iniciar sesión',
      description: 'Verifica tu correo y contraseña e intenta nuevamente.',
      color: 'red',
    }))
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })
})
