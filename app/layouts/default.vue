<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const userMenuItems = computed(() => [[
  {
    label: 'Cerrar sesión',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: () => authStore.logout(),
  },
]])
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div class="flex min-w-0 items-center gap-3">
          <NuxtLink to="/" class="flex shrink-0 items-center gap-2" aria-label="Ir al inicio">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white shadow-sm">
              D
            </div>
            <span class="hidden text-lg font-bold tracking-tight text-slate-950 sm:inline">
              Tickets <span class="text-primary-600">Datak</span>
            </span>
          </NuxtLink>

          <UBadge
            v-if="authStore.empresa"
            color="primary"
            variant="subtle"
            size="sm"
            class="hidden max-w-[12rem] truncate lg:inline-flex"
          >
            {{ authStore.empresa.nombre }}
          </UBadge>
        </div>

        <nav class="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          <UButton
            to="/tickets"
            variant="ghost"
            color="gray"
            icon="i-heroicons-queue-list"
          >
            Mis tickets
          </UButton>
          <UButton
            to="/tickets/nuevo"
            color="primary"
            icon="i-heroicons-plus"
          >
            Reportar incidencia
          </UButton>
        </nav>

        <UDropdown
          v-if="authStore.isAuthenticated"
          :items="userMenuItems"
          :popper="{ placement: 'bottom-end' }"
        >
          <UButton
            color="gray"
            variant="ghost"
            trailing-icon="i-heroicons-chevron-down"
            aria-label="Abrir menú de usuario"
            class="min-w-0"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <UIcon name="i-heroicons-user" class="h-4 w-4" />
              </span>
              <span class="hidden min-w-0 text-left sm:block">
                <span class="block max-w-[10rem] truncate text-sm font-medium text-slate-800">
                  {{ authStore.user?.nombre || 'Cliente' }}
                </span>
                <span class="block max-w-[10rem] truncate text-xs font-normal text-slate-500">
                  {{ authStore.user?.correo }}
                </span>
              </span>
            </span>
          </UButton>
        </UDropdown>
      </div>

      <div v-if="authStore.empresa" class="border-t border-slate-100 px-4 py-2 text-xs text-slate-600 lg:hidden">
        <span class="font-medium">Empresa:</span> {{ authStore.empresa.nombre }}
      </div>

      <nav class="grid grid-cols-2 border-t border-slate-200 bg-white md:hidden" aria-label="Navegación móvil">
        <NuxtLink
          to="/tickets"
          class="flex items-center justify-center gap-2 border-r border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          active-class="bg-primary-50 text-primary-700"
        >
          <UIcon name="i-heroicons-queue-list" class="h-5 w-5" />
          Mis tickets
        </NuxtLink>
        <NuxtLink
          to="/tickets/nuevo"
          class="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          active-class="bg-primary-50 text-primary-700"
        >
          <UIcon name="i-heroicons-plus-circle" class="h-5 w-5" />
          Reportar incidencia
        </NuxtLink>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <slot />
    </main>

    <footer class="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
      Sistema de Gestión de Tickets de Soporte · Datak 2026
    </footer>
  </div>
</template>
