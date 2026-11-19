import { computed, ref, watch, type Ref } from 'vue'
import { getActivePinia } from 'pinia'
import { vi } from 'vitest'

export interface NuxtCookieOptions {
  default?: () => unknown
  maxAge?: number
  path?: string
  sameSite?: string
  secure?: boolean
}

export function installNuxtMocks() {
  const persistedCookies = new Map<string, unknown>()
  const cookiesByPinia = new WeakMap<object, Map<string, Ref<unknown>>>()
  const fallbackCookies = new Map<string, Ref<unknown>>()
  const state = new Map<string, Ref<unknown>>()
  const cookieOptions = new Map<string, NuxtCookieOptions>()
  const navigateTo = vi.fn()

  vi.stubGlobal('useCookie', (key: string, options: NuxtCookieOptions = {}) => {
    cookieOptions.set(key, options)
    const activePinia = getActivePinia()
    let cookies = fallbackCookies
    if (activePinia) {
      cookies = cookiesByPinia.get(activePinia) ?? new Map<string, Ref<unknown>>()
      cookiesByPinia.set(activePinia, cookies)
    }

    if (!cookies.has(key)) {
      const initialValue = persistedCookies.has(key) ? persistedCookies.get(key) : options.default?.() ?? null
      const cookie = ref(initialValue)
      watch(cookie, (value) => persistedCookies.set(key, value), { flush: 'sync' })
      cookies.set(key, cookie)
    }
    return cookies.get(key)!
  })

  vi.stubGlobal('useState', (key: string, init: () => unknown) => {
    if (!state.has(key)) state.set(key, ref(init()))
    return state.get(key)!
  })

  vi.stubGlobal('computed', computed)
  vi.stubGlobal('navigateTo', navigateTo)

  return { cookieOptions, navigateTo }
}
