// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  telemetry: false,
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  app: {
    head: {
      title: 'Sistema de Tickets — Portal del Cliente',
      htmlAttrs: {
        lang: 'es',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sistema de gestión de tickets de soporte y atención a clientes.' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },
  colorMode: {
    preference: 'light',
  },
  runtimeConfig: {
    // Private server-side backend API URL (never exposed to client bundle)
    apiBaseUrl: process.env.NUXT_API_BASE_URL || process.env.API_BASE_URL || process.env.BACKEND_API_BASE_URL || 'http://localhost:8000',
    public: {},
  },
})
