<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import ChatbotWidget from '~/components/chatbot/ChatbotWidget.vue'
import NotificationBell from '~/components/notifications/NotificationBell.vue'

const authStore = useAuthStore()

const isSupportStaff = computed(() => {
  return (
    authStore.isSupportStaff ||
    authStore.user?.rol === 'agente_soporte' ||
    authStore.user?.rol === 'responsable_atencion'
  )
})

const supportRoleLabel = computed(() => {
  if (authStore.user?.rol === 'responsable_atencion') return 'Responsable de soporte'
  if (authStore.user?.rol === 'agente_soporte') return 'Agente de soporte'
  return 'Soporte Datak'
})

const userInitials = computed(() => {
  const name = authStore.user?.nombre?.trim()
  if (!name) return ''
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const userMenuItems = computed(() => [
  [
    {
      label: 'Cerrar sesión',
      icon: 'i-lucide-log-out',
      click: () => authStore.logout(),
    },
  ],
])

function isRadicado(text: string) {
  return /^TK-\d{4}-\d{6}$/i.test(text)
}

const breadcrumbLinks = computed(() => {
  const path = (typeof useRoute === 'function' ? useRoute()?.path : '') || ''
  if (!path || path === '/' || path === '/login') return []

  const links: Array<{ label: string; to?: string }> = []
  if (path.startsWith('/support')) {
    links.push({ label: 'Soporte', to: '/support/tickets' })
    if (path === '/support/tickets') {
      links.push({ label: 'Bandeja' })
    } else if (path === '/support/tickets/nuevo') {
      links.push({ label: 'Registrar ticket' })
    } else if (path === '/support/mis-tickets') {
      links.push({ label: 'Mis asignados' })
    } else if (path.startsWith('/support/tickets/')) {
      const parts = path.split('/')
      const radicado = parts[parts.length - 1]
      links.push({ label: 'Bandeja', to: '/support/tickets' })
      links.push({ label: radicado })
    }
  } else {
    links.push({ label: 'Portal', to: '/tickets' })
    if (path === '/tickets') {
      links.push({ label: 'Mis tickets' })
    } else if (path === '/tickets/nuevo') {
      links.push({ label: 'Reportar incidencia' })
    } else if (path.startsWith('/tickets/')) {
      const parts = path.split('/')
      const radicado = parts[parts.length - 1]
      links.push({ label: 'Mis tickets', to: '/tickets' })
      links.push({ label: radicado })
    }
  }
  return links
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-page text-default font-sans">
    <!-- TopBar with Datak 56px height, amber gradient stripe, and neutral borders -->
    <header class="sticky top-0 z-30 bg-default border-b border-default shadow-xs">
      <!-- Amber brand stripe (2px) -->
      <div class="datak-brand-stripe" aria-hidden="true" />

      <!-- TopBar content (exact 56px / h-14 height) -->
      <div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <!-- Left: Logo, Breadcrumbs, Role/Company Badge -->
        <div class="flex min-w-0 items-center gap-3">
          <NuxtLink
            :to="isSupportStaff ? '/support/tickets' : '/'"
            class="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label="Ir al inicio"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white shadow-xs">
              D
            </div>
            <span class="hidden text-base font-semibold tracking-tight text-highlighted sm:inline">
              Tickets <span class="text-primary-600">Datak</span>
            </span>
          </NuxtLink>

          <!-- Divider between Brand and Context -->
          <div v-if="breadcrumbLinks.length > 0 || isSupportStaff || authStore.empresa" class="hidden h-4 w-px bg-slate-200 dark:bg-slate-700 lg:block" aria-hidden="true" />

          <!-- Neutral Breadcrumb (Desktop) -->
          <nav v-if="breadcrumbLinks.length > 0" class="hidden min-w-0 items-center lg:flex" aria-label="Miga de pan">
            <ol class="flex items-center gap-1.5 text-xs text-muted">
              <li v-for="(crumb, idx) in breadcrumbLinks" :key="crumb.label" class="flex items-center gap-1.5">
                <NuxtLink
                  v-if="crumb.to && idx < breadcrumbLinks.length - 1"
                  :to="crumb.to"
                  class="transition-colors hover:text-highlighted truncate max-w-[10rem]"
                >
                  {{ crumb.label }}
                </NuxtLink>
                <span
                  v-else
                  class="font-medium text-highlighted truncate max-w-[12rem]"
                  :class="{ 'tabular-nums': isRadicado(crumb.label) }"
                >
                  {{ crumb.label }}
                </span>
                <UIcon
                  v-if="idx < breadcrumbLinks.length - 1"
                  name="i-lucide-chevron-right"
                  class="h-3.5 w-3.5 text-dimmed shrink-0"
                />
              </li>
            </ol>
          </nav>

          <!-- Support Badge for internal staff -->
          <UBadge
            v-if="isSupportStaff"
            color="amber"
            variant="subtle"
            size="xs"
            class="hidden max-w-[14rem] truncate lg:inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 dark:border-amber-800/80"
          >
            <UIcon name="i-lucide-shield-check" class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span class="truncate">{{ supportRoleLabel }}</span>
          </UBadge>

          <!-- Client Company Badge -->
          <UBadge
            v-else-if="authStore.empresa"
            color="primary"
            variant="subtle"
            size="xs"
            class="hidden max-w-[14rem] truncate lg:inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 dark:border-purple-800/80"
          >
            <UIcon name="i-lucide-building-2" class="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
            <span class="truncate">{{ authStore.empresa.nombre }}</span>
          </UBadge>
        </div>

        <!-- Center/Right: Desktop Navigation -->
        <nav class="hidden items-center gap-1.5 md:flex" aria-label="Navegación principal">
          <!-- Support Staff Links -->
          <template v-if="isSupportStaff">
            <UButton
              to="/support/tickets"
              variant="ghost"
              color="gray"
              icon="i-lucide-inbox"
              size="sm"
            >
              Bandeja de soporte
            </UButton>
            <UButton
              to="/support/tickets/nuevo"
              variant="ghost"
              color="gray"
              icon="i-lucide-plus-circle"
              size="sm"
            >
              Registrar ticket
            </UButton>
            <UButton
              to="/support/mis-tickets"
              variant="ghost"
              color="gray"
              icon="i-lucide-user-check"
              size="sm"
            >
              Mis asignados
            </UButton>
          </template>

          <!-- Client Links -->
          <template v-else>
            <UButton
              to="/tickets"
              variant="ghost"
              color="gray"
              icon="i-lucide-ticket"
              size="sm"
            >
              Mis tickets
            </UButton>
            <UButton
              to="/tickets/nuevo"
              color="primary"
              variant="solid"
              icon="i-lucide-plus"
              size="sm"
            >
              Reportar incidencia
            </UButton>
          </template>
        </nav>

        <!-- Right: Notification Bell & User Dropdown -->
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-2">
          <!-- Notification Center Bell (FE-21) -->
          <NotificationBell />

          <UDropdown
            :items="userMenuItems"
            :popper="{ placement: 'bottom-end' }"
          >
            <UButton
              color="gray"
              variant="ghost"
              trailing-icon="i-lucide-chevron-down"
              aria-label="Abrir menú de usuario"
              class="min-w-0 p-1 sm:px-2 rounded-lg"
            >
              <span class="flex min-w-0 items-center gap-2">
                <!-- Circular Avatar -->
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100/70 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-semibold text-xs border border-primary-200/80 dark:border-primary-800/80">
                  <UIcon v-if="!userInitials" name="i-lucide-user" class="h-4 w-4" />
                  <span v-else>{{ userInitials }}</span>
                </span>
                <span class="hidden min-w-0 text-left sm:block">
                  <span class="block max-w-[10rem] truncate text-xs font-medium text-highlighted">
                    {{ authStore.user?.nombre || (isSupportStaff ? 'Agente Soporte' : 'Cliente Datak') }}
                  </span>
                  <span class="block max-w-[10rem] truncate text-[11px] font-normal text-muted tabular-nums">
                    {{ authStore.user?.correo }}
                  </span>
                </span>
              </span>
            </UButton>
          </UDropdown>
        </div>
      </div>

      <!-- Mobile info banner for Client Company / Staff role -->
      <div v-if="!isSupportStaff && authStore.empresa" class="border-t border-default bg-muted/40 px-4 py-1.5 text-xs text-muted lg:hidden flex items-center gap-1.5">
        <UIcon name="i-lucide-building-2" class="h-3.5 w-3.5 text-primary-600 shrink-0" />
        <span class="font-medium text-default">Empresa:</span>
        <span class="truncate">{{ authStore.empresa.nombre }}</span>
      </div>
      <div v-else-if="isSupportStaff" class="border-t border-default bg-amber-50/60 dark:bg-amber-950/20 px-4 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 lg:hidden flex items-center gap-1.5">
        <UIcon name="i-lucide-shield-check" class="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <span class="truncate">{{ supportRoleLabel }}</span>
      </div>

      <!-- Mobile Navigation -->
      <nav
        class="border-t border-default bg-default md:hidden"
        :class="isSupportStaff ? 'grid grid-cols-3' : 'grid grid-cols-2'"
        aria-label="Navegación móvil"
      >
        <template v-if="isSupportStaff">
          <NuxtLink
            to="/support/tickets"
            class="flex items-center justify-center gap-1.5 border-r border-default px-2 py-2.5 text-xs font-medium text-muted hover:bg-muted hover:text-highlighted transition-colors"
            active-class="bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold"
          >
            <UIcon name="i-lucide-inbox" class="h-4 w-4" />
            Bandeja
          </NuxtLink>
          <NuxtLink
            to="/support/tickets/nuevo"
            class="flex items-center justify-center gap-1.5 border-r border-default px-2 py-2.5 text-xs font-medium text-muted hover:bg-muted hover:text-highlighted transition-colors"
            active-class="bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold"
          >
            <UIcon name="i-lucide-plus-circle" class="h-4 w-4" />
            Registrar
          </NuxtLink>
          <NuxtLink
            to="/support/mis-tickets"
            class="flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium text-muted hover:bg-muted hover:text-highlighted transition-colors"
            active-class="bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold"
          >
            <UIcon name="i-lucide-user-check" class="h-4 w-4" />
            Asignados
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink
            to="/tickets"
            class="flex items-center justify-center gap-2 border-r border-default px-3 py-2.5 text-sm font-medium text-muted hover:bg-muted hover:text-highlighted transition-colors"
            active-class="bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold"
          >
            <UIcon name="i-lucide-ticket" class="h-4 w-4" />
            Mis tickets
          </NuxtLink>
          <NuxtLink
            to="/tickets/nuevo"
            class="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-muted hover:bg-muted hover:text-highlighted transition-colors"
            active-class="bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold"
          >
            <UIcon name="i-lucide-plus-circle" class="h-4 w-4" />
            Reportar incidencia
          </NuxtLink>
        </template>
      </nav>
    </header>

    <!-- Main Workspace Content -->
    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-default bg-default px-4 py-4 text-center text-xs text-muted">
      Sistema de Gestión de Tickets de Soporte · Datak 2026
    </footer>

    <!-- Floating Chatbot Assistant Widget (Only for clients, FE-10) -->
    <ChatbotWidget v-if="!isSupportStaff" />
  </div>
</template>
