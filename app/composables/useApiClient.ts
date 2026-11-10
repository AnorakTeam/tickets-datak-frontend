import { useAuthStore } from '~/stores/auth'

export const useApiClient = () => {
  const authStore = useAuthStore()

  const api = $fetch.create({
    baseURL: '/api/v1',
    onRequest({ options }) {
      if (authStore.accessToken) {
        const headers = (options.headers = new Headers(options.headers))
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${authStore.accessToken}`)
        }
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401 && authStore.refreshToken) {
        try {
          const res = await $fetch<{ access: string }>('/api/v1/auth/token/refresh/', {
            method: 'POST',
            body: { refresh: authStore.refreshToken },
          })
          authStore.accessToken = res.access
        } catch {
          authStore.clear()
        }
      }
    },
  })

  return api
}
