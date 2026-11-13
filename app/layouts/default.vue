<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import ChatbotWidget from '~/components/chatbot/ChatbotWidget.vue'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.clear()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
    <!-- Header / Navbar -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              T
            </div>
            <span class="text-xl font-bold tracking-tight text-slate-900">
              Tickets <span class="text-blue-600 font-semibold">Datak</span>
            </span>
          </NuxtLink>

          <UBadge v-if="authStore.empresa" color="primary" variant="subtle" size="sm" class="hidden sm:inline-flex">
            {{ authStore.empresa.nombre }}
          </UBadge>
        </div>

        <!-- Navigation Links -->
        <nav class="flex items-center space-x-3">
          <UButton
            to="/tickets"
            variant="ghost"
            color="gray"
            icon="i-heroicons-queue-list"
            class="text-sm font-medium"
          >
            Mis Tickets
          </UButton>

          <UButton
            to="/tickets/nuevo"
            color="primary"
            icon="i-heroicons-plus-circle"
            class="text-sm font-medium"
          >
            Reportar Incidencia
          </UButton>

          <!-- User Badge / Logout -->
          <div v-if="authStore.isAuthenticated" class="flex items-center pl-2 space-x-2 border-l border-slate-200">
            <span class="text-xs text-slate-500 hidden md:inline-block">
              {{ authStore.user?.correo }}
            </span>
            <UButton
              variant="ghost"
              color="red"
              icon="i-heroicons-arrow-right-on-rectangle"
              size="xs"
              @click="handleLogout"
            />
          </div>
        </nav>
      </div>
    </header>

    <!-- Main View Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
      Sistema de Gestión de Tickets de Soporte · API-DATAK 2026
    </footer>

    <!-- Floating Chatbot Assistant Widget (FE-10) -->
    <ChatbotWidget />
  </div>
</template>
