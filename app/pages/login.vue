<script setup lang="ts">
import { reactive, ref } from 'vue'
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
  <div class="relative flex min-h-screen flex-col items-center justify-center bg-page px-4 py-12 sm:px-6 lg:px-8">
    <!-- Datak Top Accent Stripe -->
    <div class="fixed inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600" />

    <main class="w-full max-w-sm sm:max-w-md">
      <!-- Centered Compact Card -->
      <div class="rounded-xl border border-default bg-default p-6 shadow-sm sm:p-8">
        <!-- Datak Brand Header -->
        <div class="mb-6 flex flex-col items-center text-center">
          <img src="/img/Datak.png" alt="Datak" class="h-10 w-auto mb-3" />
          <h1 class="text-xl font-semibold tracking-tight text-highlighted">
            Iniciar sesión
          </h1>
          <p class="mt-1 text-xs leading-relaxed text-muted">
            Ingresa con las credenciales corporativas asociadas a tu empresa.
          </p>
        </div>

        <form class="space-y-4" novalidate @submit.prevent="submit">
          <UFormGroup
            label="Correo electrónico"
            name="email"
            required
            :ui="{ label: { base: 'block text-xs font-medium text-muted mb-1.5' } }"
          >
            <UInput
              v-model="credentials.email"
              type="email"
              autocomplete="email"
              placeholder="nombre@empresa.com"
              icon="i-lucide-mail"
              size="md"
              :disabled="isSubmitting"
            />
          </UFormGroup>

          <UFormGroup
            label="Contraseña"
            name="password"
            required
            :ui="{ label: { base: 'block text-xs font-medium text-muted mb-1.5' } }"
          >
            <UInput
              v-model="credentials.password"
              type="password"
              autocomplete="current-password"
              placeholder="Ingresa tu contraseña"
              icon="i-lucide-lock"
              size="md"
              :disabled="isSubmitting"
            />
          </UFormGroup>

          <div class="pt-2">
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              size="md"
              block
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión' }}
            </UButton>
          </div>
        </form>
      </div>

      <p class="mt-4 text-center text-xs leading-relaxed text-muted">
        Si no puedes acceder, comunícate con el responsable de Datak en tu empresa.
      </p>
    </main>
  </div>
</template>
