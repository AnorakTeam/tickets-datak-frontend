<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  notificationService,
  type ClientNotification,
} from '~/services/notificationService'
import { formatTicketDateTime } from '~/utils/ticketPresentation'

const router = useRouter()

const isOpen = ref(false)
const isLoading = ref(false)
const notifications = ref<ClientNotification[]>([])
const unreadCount = ref(0)
let pollTimer: any = null

const toggleOpen = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    void fetchNotifications()
  }
}

const close = () => {
  isOpen.value = false
}

const fetchNotifications = async () => {
  isLoading.value = true
  try {
    const feed = await notificationService.getClientNotifications()
    notifications.value = feed.notifications
    unreadCount.value = feed.unreadCount
  } catch {
    // Keep current state gracefully on network/auth failure
  } finally {
    isLoading.value = false
  }
}

const extractRadicado = (item: ClientNotification): string | null => {
  return item.ticket_radicado || item.radicado || item.ticket?.radicado || null
}

const handleNotificationClick = async (item: ClientNotification) => {
  if (!item.leida) {
    item.leida = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    try {
      await notificationService.markNotificationAsRead(item.id)
    } catch {
      // Non-blocking error
    }
  }

  const radicado = extractRadicado(item)
  close()

  if (radicado) {
    await router.push(`/tickets/${encodeURIComponent(radicado)}`)
  }
}

const getNotificationIcon = (item: ClientNotification) => {
  const tipo = (item.tipo || '').toLowerCase()
  const title = (item.titulo || '').toLowerCase()

  if (tipo.includes('resol') || title.includes('resuelto')) {
    return { name: 'i-lucide-check-circle-2', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' }
  }
  if (tipo.includes('no_procedente') || title.includes('no procedente')) {
    return { name: 'i-lucide-x-circle', color: 'text-muted bg-muted' }
  }
  return { name: 'i-lucide-bell', color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/40' }
}

onMounted(() => {
  void fetchNotifications()
  pollTimer = setInterval(() => {
    void fetchNotifications()
  }, 60000)
})

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<template>
  <div class="relative inline-flex items-center">
    <!-- Trigger Button -->
    <button
      type="button"
      class="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-muted hover:text-highlighted focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
      :aria-label="`Notificaciones (${unreadCount} no leídas)`"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggleOpen"
    >
      <UIcon name="i-lucide-bell" class="h-4 w-4" />

      <!-- Unread Badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold tabular-nums text-white shadow-sm ring-2 ring-default"
        aria-hidden="true"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Backdrop for click-outside -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-transparent"
      @click="close"
    />

    <!-- Notifications Dropdown Panel -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 rounded-xl border border-default bg-default shadow-xl overflow-hidden text-left"
        role="region"
        aria-label="Centro de notificaciones"
      >
        <!-- Panel Header -->
        <div class="flex items-center justify-between border-b border-default px-4 py-3 bg-muted/60">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-highlighted">
              Notificaciones
            </h3>
            <span
              v-if="unreadCount > 0"
              class="rounded-full bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300 tabular-nums"
            >
              {{ unreadCount }} {{ unreadCount === 1 ? 'nueva' : 'nuevas' }}
            </span>
          </div>

          <button
            type="button"
            class="text-muted hover:text-highlighted p-1 rounded transition-colors"
            :disabled="isLoading"
            title="Actualizar notificaciones"
            aria-label="Actualizar notificaciones"
            @click="fetchNotifications"
          >
            <UIcon
              name="i-lucide-rotate-cw"
              class="h-3.5 w-3.5"
              :class="{ 'animate-spin': isLoading }"
            />
          </button>
        </div>

        <!-- Notifications List -->
        <div class="max-h-80 overflow-y-auto divide-y divide-default">
          <!-- Loading skeleton -->
          <div v-if="isLoading && notifications.length === 0" class="p-4 space-y-3">
            <div v-for="i in 3" :key="i" class="h-12 w-full animate-pulse rounded-lg bg-muted" />
          </div>

          <!-- Empty state -->
          <div
            v-else-if="notifications.length === 0"
            class="py-8 px-4 text-center text-muted"
          >
            <UIcon name="i-lucide-bell-off" class="mx-auto h-8 w-8 text-dimmed mb-1" />
            <p class="text-xs font-medium text-highlighted">No tienes notificaciones</p>
            <p class="mt-0.5 text-[11px] text-muted">
              Te avisaremos cuando el equipo de soporte actualice o resuelva tus tickets.
            </p>
          </div>

          <!-- List Items -->
          <template v-else>
            <button
              v-for="item in notifications"
              :key="item.id"
              type="button"
              class="w-full text-left p-3.5 hover:bg-muted/60 transition-colors flex items-start gap-3 relative group"
              :class="{ 'bg-primary-50/30 dark:bg-primary-950/10': !item.leida }"
              @click="handleNotificationClick(item)"
            >
              <!-- Icon Indicator -->
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                :class="getNotificationIcon(item).color"
              >
                <UIcon :name="getNotificationIcon(item).name" class="h-4 w-4" />
              </span>

              <!-- Content -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-1">
                  <p class="text-xs font-semibold text-highlighted truncate">
                    {{ item.titulo }}
                  </p>
                  <span
                    v-if="!item.leida"
                    class="h-2 w-2 shrink-0 rounded-full bg-primary-600"
                    title="No leída"
                  />
                </div>

                <p class="mt-0.5 text-xs text-muted line-clamp-2 leading-snug">
                  {{ item.mensaje }}
                </p>

                <div class="mt-1 flex items-center justify-between text-[11px] text-muted tabular-nums">
                  <span v-if="extractRadicado(item)" class="font-mono text-primary-600 dark:text-primary-400 font-medium">
                    {{ extractRadicado(item) }}
                  </span>
                  <span>
                    {{ formatTicketDateTime(item.fecha_creacion) }}
                  </span>
                </div>
              </div>
            </button>
          </template>
        </div>

        <!-- Footer -->
        <div class="border-t border-default bg-muted/40 p-2 text-center">
          <NuxtLink
            to="/tickets"
            class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 py-1"
            @click="close"
          >
            Ver todos mis tickets
            <UIcon name="i-lucide-arrow-right" class="h-3 w-3" />
          </NuxtLink>
        </div>
      </div>
    </transition>
  </div>
</template>
