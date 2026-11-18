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
    return { name: 'i-heroicons-check-circle', color: 'text-green-600 bg-green-50' }
  }
  if (tipo.includes('no_procedente') || title.includes('no procedente')) {
    return { name: 'i-heroicons-x-circle', color: 'text-slate-600 bg-slate-100' }
  }
  return { name: 'i-heroicons-bell', color: 'text-primary-600 bg-primary-50' }
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
      class="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
      :aria-label="`Notificaciones (${unreadCount} no leídas)`"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggleOpen"
    >
      <UIcon name="i-heroicons-bell" class="h-5 w-5" />

      <!-- Unread Badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
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
        class="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden text-left"
        role="region"
        aria-label="Centro de notificaciones"
      >
        <!-- Panel Header -->
        <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800">
              Notificaciones
            </h3>
            <span
              v-if="unreadCount > 0"
              class="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700"
            >
              {{ unreadCount }} {{ unreadCount === 1 ? 'nueva' : 'nuevas' }}
            </span>
          </div>

          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
            :disabled="isLoading"
            title="Actualizar notificaciones"
            aria-label="Actualizar notificaciones"
            @click="fetchNotifications"
          >
            <UIcon
              name="i-heroicons-arrow-path"
              class="h-3.5 w-3.5"
              :class="{ 'animate-spin': isLoading }"
            />
          </button>
        </div>

        <!-- Notifications List -->
        <div class="max-h-80 overflow-y-auto divide-y divide-slate-100">
          <!-- Loading skeleton -->
          <div v-if="isLoading && notifications.length === 0" class="p-4 space-y-3">
            <div v-for="i in 3" :key="i" class="h-12 w-full animate-pulse rounded-lg bg-slate-100" />
          </div>

          <!-- Empty state -->
          <div
            v-else-if="notifications.length === 0"
            class="py-8 px-4 text-center text-slate-500"
          >
            <UIcon name="i-heroicons-bell-slash" class="mx-auto h-8 w-8 text-slate-300 mb-1" />
            <p class="text-xs font-medium text-slate-700">No tienes notificaciones</p>
            <p class="mt-0.5 text-[11px] text-slate-400">
              Te avisaremos cuando el equipo de soporte actualice o resuelva tus tickets.
            </p>
          </div>

          <!-- List Items -->
          <template v-else>
            <button
              v-for="item in notifications"
              :key="item.id"
              type="button"
              class="w-full text-left p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 relative group"
              :class="{ 'bg-primary-50/30': !item.leida }"
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
                  <p class="text-xs font-semibold text-slate-900 truncate">
                    {{ item.titulo }}
                  </p>
                  <span
                    v-if="!item.leida"
                    class="h-2 w-2 shrink-0 rounded-full bg-primary-600"
                    title="No leída"
                  />
                </div>

                <p class="mt-0.5 text-xs text-slate-600 line-clamp-2 leading-snug">
                  {{ item.mensaje }}
                </p>

                <div class="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span v-if="extractRadicado(item)" class="font-mono text-primary-700 font-medium">
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
        <div class="border-t border-slate-100 bg-slate-50/50 p-2 text-center">
          <NuxtLink
            to="/tickets"
            class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 py-1"
            @click="close"
          >
            Ver todos mis tickets
            <UIcon name="i-heroicons-arrow-right" class="h-3 w-3" />
          </NuxtLink>
        </div>
      </div>
    </transition>
  </div>
</template>
