import { computed, ref, type Ref } from 'vue'
import { vi } from 'vitest'

export function installNuxtMocks() {
  const cookies = new Map<string, Ref<unknown>>()
  const state = new Map<string, Ref<unknown>>()

  vi.stubGlobal('useCookie', (key: string) => {
    if (!cookies.has(key)) cookies.set(key, ref(null))
    return cookies.get(key)!
  })

  vi.stubGlobal('useState', (key: string, init: () => unknown) => {
    if (!state.has(key)) state.set(key, ref(init()))
    return state.get(key)!
  })

  vi.stubGlobal('computed', computed)

  return { cookies, state }
}
