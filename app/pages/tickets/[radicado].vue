<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useClientTicketDetail } from '~/composables/useClientTicketDetail'
import {
  formatTicketDateTime,
  getTicketPriorityPresentation,
  getTicketStatusPresentation,
} from '~/utils/ticketPresentation'

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Detalle del ticket — Tickets Datak',
})

type CopyFeedback = 'idle' | 'copied' | 'failed'

interface TimelineItem {
  label: string
  description: string
  state: 'completed' | 'current' | 'pending'
}

const route = useRoute()
const copyFeedback = ref<CopyFeedback>('idle')
const { ticket, isLoading, error, loadTicket } = useClientTicketDetail()

const routeRadicado = computed(() => {
  const value = route.params.radicado
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
})

const statusPresentation = computed(() => {
  return ticket.value?.estado
    ? getTicketStatusPresentation(ticket.value.estado)
    : { label: 'Estado no disponible', color: 'gray' as const }
})

const priorityPresentation = computed(() => {
  return ticket.value?.prioridad
    ? getTicketPriorityPresentation(ticket.value.prioridad)
    : { label: 'Prioridad no disponible', color: 'gray' as const }
})

const moduleName = computed(() => {
  return ticket.value?.modulo_nombre || ticket.value?.modulo?.nombre || 'No especificado'
})

const getStatusIcon = (estado?: string): string => {
  switch (estado) {
    case 'Abierto':
      return 'i-lucide-clock'
    case 'En gestion':
      return 'i-lucide-hourglass'
    case 'Resuelto':
      return 'i-lucide-check-circle-2'
    case 'No procedente':
      return 'i-lucide-ban'
    default:
      return 'i-lucide-help-circle'
  }
}

const getPriorityIcon = (prioridad?: string): string => {
  switch (prioridad) {
    case 'Baja':
      return 'i-lucide-arrow-down'
    case 'Media':
      return 'i-lucide-minus'
    case 'Alta':
      return 'i-lucide-arrow-up'
    case 'Critica':
      return 'i-lucide-alert-triangle'
    default:
      return 'i-lucide-info'
  }
}

const timeline = computed<TimelineItem[]>(() => {
  if (!ticket.value) return []

  const reception: TimelineItem = {
    label: 'Recepción',
    description: formatTicketDateTime(ticket.value.fecha_creacion),
    state: ticket.value.estado === 'Abierto' ? 'current' : 'completed',
  }

  if (ticket.value.estado === 'Abierto') {
    return [
      reception,
      { label: 'Cierre', description: 'Pendiente', state: 'pending' },
    ]
  }

  if (ticket.value.estado === 'En gestion') {
    return [
      reception,
      { label: 'En gestión', description: 'El equipo está revisando el caso', state: 'current' },
      { label: 'Cierre', description: 'Pendiente', state: 'pending' },
    ]
  }

  return [
    reception,
    {
      label: ticket.value.estado === 'Resuelto' ? 'Resuelto' : 'No procedente',
      description: formatTicketDateTime(ticket.value.fecha_resolucion),
      state: 'current',
    },
  ]
})

const retry = () => {
  void loadTicket(routeRadicado.value)
}

const copyRadicado = async () => {
  if (!ticket.value) return

  copyFeedback.value = 'idle'

  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      throw new Error('Portapapeles no disponible en el navegador')
    }

    await navigator.clipboard.writeText(ticket.value.radicado)
    copyFeedback.value = 'copied'
  } catch {
    copyFeedback.value = 'failed'
  }
}

watch(
  routeRadicado,
  (radicado) => {
    copyFeedback.value = 'idle'
    void loadTicket(radicado)
  },
  { immediate: true },
)
</script>

<template>
  <section class="space-y-5">
    <!-- Back to tickets link -->
    <div>
      <NuxtLink
        to="/tickets"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-highlighted transition-colors"
      >
        <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
        Volver a mis tickets
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="rounded-xl border border-default bg-default p-10 text-center shadow-xs"
      data-testid="ticket-detail-loading"
    >
      <UIcon name="i-lucide-loader-2" class="mx-auto h-8 w-8 animate-spin text-primary-500" />
      <p class="mt-3 text-xs text-muted">Cargando detalle del ticket...</p>
    </div>

    <!-- Error States -->
    <div
      v-else-if="error"
      class="rounded-xl border border-default bg-default p-8 text-center shadow-xs"
      data-testid="ticket-detail-error"
    >
      <UIcon
        :name="error === 'request-failed' ? 'i-lucide-wifi-off' : 'i-lucide-file-question'"
        class="mx-auto h-10 w-10 text-muted"
      />

      <template v-if="error === 'not-found'">
        <h1 class="mt-4 text-lg font-bold text-highlighted">Ticket no encontrado</h1>
        <p class="mt-1 text-xs text-muted">
          No encontramos un ticket disponible con ese radicado.
        </p>
      </template>

      <template v-else-if="error === 'invalid-radicado'">
        <h1 class="mt-4 text-lg font-bold text-highlighted">Radicado no válido</h1>
        <p class="mt-1 text-xs text-muted">
          Verifica el número del radicado e intenta nuevamente.
        </p>
      </template>

      <template v-else>
        <h1 class="mt-4 text-lg font-bold text-highlighted">No fue posible cargar el ticket</h1>
        <p class="mt-1 text-xs text-muted">
          Revisa tu conexión e intenta nuevamente.
        </p>
        <UButton
          class="mt-4"
          color="primary"
          variant="soft"
          size="sm"
          icon="i-lucide-refresh-cw"
          data-testid="retry-ticket-detail"
          @click="retry"
        >
          Reintentar
        </UButton>
      </template>
    </div>

    <!-- Ready / Ticket Display -->
    <template v-else-if="ticket">
      <!-- Clean Header: Radicado in bold tabular-nums, Semantic Badges, Copy Action -->
      <header class="rounded-xl border border-default bg-default p-5 sm:p-6 shadow-xs">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0 space-y-2">
            <!-- Radicado and semantic badges row -->
            <div class="flex flex-wrap items-center gap-2.5">
              <span class="font-mono text-xl sm:text-2xl font-bold tabular-nums text-highlighted tracking-tight">
                {{ ticket.radicado }}
              </span>
              <UBadge :color="statusPresentation.color" variant="subtle" size="xs" class="rounded-md font-medium text-xs">
                <UIcon :name="getStatusIcon(ticket.estado)" class="w-3.5 h-3.5 mr-1" />
                {{ statusPresentation.label }}
              </UBadge>
              <UBadge :color="priorityPresentation.color" variant="subtle" size="xs" class="rounded-md font-medium text-xs">
                <UIcon :name="getPriorityIcon(ticket.prioridad)" class="w-3.5 h-3.5 mr-1" />
                Prioridad {{ priorityPresentation.label.toLowerCase() }}
              </UBadge>
            </div>

            <!-- Subject -->
            <h1 class="text-lg sm:text-xl font-bold tracking-tight text-highlighted">
              {{ ticket.asunto }}
            </h1>
          </div>

          <!-- Quick copy widget -->
          <div class="flex items-center gap-2.5 self-start rounded-lg border border-default bg-muted px-3 py-2">
            <div class="text-xs">
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-muted">Radicado</span>
              <span class="font-mono font-bold tabular-nums text-highlighted text-xs sm:text-sm">{{ ticket.radicado }}</span>
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-default bg-default text-muted hover:text-highlighted hover:bg-muted transition-colors"
              aria-label="Copiar radicado"
              data-testid="copy-ticket-radicado"
              @click="copyRadicado"
            >
              <UIcon name="i-lucide-copy" class="h-4 w-4" />
            </button>
            <p
              v-if="copyFeedback !== 'idle'"
              class="text-xs font-medium ml-1"
              :class="copyFeedback === 'copied' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
              role="status"
              data-testid="copy-feedback"
            >
              {{ copyFeedback === 'copied'
                ? 'Radicado copiado.'
                : 'No fue posible copiar el radicado.' }}
            </p>
          </div>
        </div>
      </header>

      <!-- Main Layout Grid: Info Card + Audit Timeline -->
      <div class="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div class="space-y-5">
          <!-- Information Card in rounded-xl border-default -->
          <article class="rounded-xl border border-default bg-default p-5 sm:p-6 shadow-xs">
            <h2 class="text-base font-semibold text-highlighted">Información reportada</h2>

            <dl class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-medium text-muted">Módulo</dt>
                <dd class="mt-1 text-sm font-medium text-highlighted">{{ moduleName }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium text-muted">Pantalla o documento</dt>
                <dd class="mt-1 text-sm font-medium text-highlighted">
                  {{ ticket.pestana_o_documento }}
                </dd>
              </div>
              <div>
                <dt class="text-xs font-medium text-muted">Canal de origen</dt>
                <dd class="mt-1 text-sm font-medium text-highlighted">{{ ticket.canal_origen }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium text-muted">Fecha de creación</dt>
                <dd class="mt-1 text-sm font-medium text-highlighted tabular-nums">
                  {{ formatTicketDateTime(ticket.fecha_creacion) }}
                </dd>
              </div>
            </dl>

            <div class="mt-5 border-t border-default pt-4">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">Descripción</h3>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-default">
                {{ ticket.descripcion }}
              </p>
            </div>

            <!-- Reported System Error Code / Trace -->
            <div
              v-if="ticket.mensaje_error"
              class="mt-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-4"
            >
              <div class="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <UIcon name="i-lucide-alert-triangle" class="w-3.5 h-3.5 shrink-0" />
                <span>Mensaje del sistema reportado</span>
              </div>
              <p class="mt-1.5 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-amber-900 dark:text-amber-200 tabular-nums">
                {{ ticket.mensaje_error }}
              </p>
            </div>
          </article>

          <!-- Resolved Solution Card -->
          <article
            v-if="ticket.estado === 'Resuelto'"
            class="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 sm:p-6 shadow-xs"
            data-testid="solution-card"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-check-circle-2" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-emerald-950 dark:text-emerald-100">Solución</h2>
                <p class="whitespace-pre-wrap text-sm leading-6 text-emerald-900 dark:text-emerald-200">
                  {{ ticket.comentario_solucion || 'La solución aún no está disponible.' }}
                </p>
                <p v-if="ticket.fecha_resolucion" class="text-xs text-emerald-700 dark:text-emerald-300 tabular-nums pt-1">
                  Resuelto el {{ formatTicketDateTime(ticket.fecha_resolucion) }}
                </p>
              </div>
            </div>
          </article>

          <!-- Non-proceeding Card -->
          <article
            v-if="ticket.estado === 'No procedente'"
            class="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 p-5 sm:p-6 shadow-xs"
            data-testid="non-proceeding-card"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-ban" class="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-red-950 dark:text-red-100">Motivo de no procedencia</h2>
                <p class="whitespace-pre-wrap text-sm leading-6 text-red-900 dark:text-red-200">
                  {{ ticket.motivo_no_procedente || 'El motivo aún no está disponible.' }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <!-- Clean Audit Timeline Aside -->
        <aside class="h-fit rounded-xl border border-default bg-default p-5 sm:p-6 shadow-xs">
          <h2 class="text-base font-semibold text-highlighted">Estado del ticket</h2>
          <ol class="mt-5 space-y-0" data-testid="ticket-timeline">
            <li
              v-for="(item, index) in timeline"
              :key="`${item.label}-${index}`"
              class="relative flex gap-3.5 pb-6 last:pb-0"
            >
              <!-- Connecting vertical line -->
              <span
                v-if="index < timeline.length - 1"
                class="absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5"
                :class="item.state === 'pending' ? 'bg-default border-l border-default' : 'bg-primary-300 dark:bg-primary-700'"
              />
              <!-- Node icon / circle -->
              <span
                class="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                :class="{
                  'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-950/40': item.state === 'current',
                  'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/40': item.state === 'completed',
                  'border border-default bg-muted text-dimmed': item.state === 'pending',
                }"
              >
                <UIcon v-if="item.state === 'completed'" name="i-lucide-check" class="h-3.5 w-3.5" />
                <span v-else-if="item.state === 'current'" class="h-2 w-2 rounded-full bg-white" />
                <span v-else class="h-1.5 w-1.5 rounded-full bg-dimmed" />
              </span>
              <div>
                <p class="text-sm font-semibold text-highlighted">{{ item.label }}</p>
                <p class="mt-0.5 text-xs text-muted tabular-nums leading-5">{{ item.description }}</p>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </template>
  </section>
</template>
