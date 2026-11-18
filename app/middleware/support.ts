import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  const allowedRoles = ['agente_soporte', 'responsable_atencion']
  const userRole = authStore.userRole

  if (!userRole || !allowedRoles.includes(userRole)) {
    return navigateTo('/tickets')
  }
})
