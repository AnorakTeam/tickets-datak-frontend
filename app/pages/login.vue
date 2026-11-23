<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: false,
})

useHead({
  title: 'Iniciar sesión — Tickets Datak',
})

const authStore = useAuthStore()
const toast = useToast()
const credentials = reactive({
  email: '',
  password: '',
})
const isSubmitting = ref(false)

const submit = async () => {
  const email = credentials.email.trim()

  if (!email || !credentials.password) {
    toast.add({
      title: 'Datos incompletos',
      description: 'Ingresa tu correo electrónico y contraseña.',
      color: 'red',
    })
    return
  }

  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    await authStore.login(email, credentials.password)
  } catch {
    toast.add({
      title: 'No fue posible iniciar sesión',
      description: 'Verifica tu correo y contraseña e intenta nuevamente.',
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-page lg:grid lg:grid-cols-2">
    <section class="relative hidden overflow-hidden bg-slate-950 px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-950 via-slate-950 to-slate-950" />
      <div class="absolute -right-28 top-20 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />

      <div class="relative flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-xl font-bold text-white shadow-lg shadow-primary-950/40">
          D
        </div>
        <span class="text-2xl font-bold tracking-tight">Datak</span>
      </div>

      <div class="relative max-w-xl">
        <div class="h-0.5 w-16 bg-gradient-to-r from-amber-500 to-amber-600 mb-6 rounded-full" />
        <p class="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
          Portal de soporte
        </p>
        <h1 class="text-4xl font-bold leading-tight xl:text-5xl">
          Tus solicitudes de soporte, claras y en un solo lugar.
        </h1>
        <p class="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
          Reporta incidencias de tus módulos contratados y consulta su avance con un radicado único.
        </p>
      </div>

      <p class="relative text-xs text-slate-400">
        Sistema de Gestión de Tickets de Soporte · Datak ERP
      </p>
    </section>

    <main class="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
      <div class="w-full max-w-md">
        <div class="mb-10 flex items-center gap-3 lg:hidden">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white shadow-sm">
            D
          </div>
          <span class="text-2xl font-bold tracking-tight text-highlighted">Datak</span>
        </div>

        <div class="mb-8">
          <p class="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Portal de soporte</p>
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
            Iniciar sesión
          </h2>
          <p class="mt-2 text-sm leading-6 text-muted">
            Ingresa con las credenciales asociadas a tu empresa.
          </p>
        </div>

        <UCard :ui="{ body: { padding: 'px-5 py-6 sm:p-8' }, ring: 'ring-1 ring-default', shadow: 'shadow-sm', rounded: 'rounded-xl', background: 'bg-default' }">
          <form class="space-y-5" novalidate @submit.prevent="submit">
            <UFormGroup label="Correo electrónico" name="email" required>
              <UInput
                v-model="credentials.email"
                type="email"
                autocomplete="email"
                placeholder="nombre@empresa.com"
                icon="i-lucide-mail"
                size="lg"
                :disabled="isSubmitting"
              />
            </UFormGroup>

            <UFormGroup label="Contraseña" name="password" required>
              <UInput
                v-model="credentials.password"
                type="password"
                autocomplete="current-password"
                placeholder="Ingresa tu contraseña"
                icon="i-lucide-lock"
                size="lg"
                :disabled="isSubmitting"
              />
            </UFormGroup>

            <UButton
              type="submit"
              color="primary"
              variant="solid"
              size="lg"
              block
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión' }}
            </UButton>
          </form>
        </UCard>

        <p class="mt-6 text-center text-xs leading-5 text-muted">
          Si no puedes acceder, comunícate con el responsable de Datak en tu empresa.
        </p>
      </div>
    </main>
  </div>
</template>
