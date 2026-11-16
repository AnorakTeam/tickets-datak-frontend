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
      throw new Error('Clipboard unavailable')
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
  <section class="space-y-6">
    <NuxtLink
      to="/tickets"
      class="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
    >
      <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
      Volver a mis tickets
    </NuxtLink>

    <div
      v-if="isLoading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center"
      data-testid="ticket-detail-loading"
    >
      <UIcon name="i-heroicons-arrow-path" class="mx-auto h-8 w-8 animate-spin text-primary-600" />
      <p class="mt-3 text-sm text-slate-600">Cargando detalle del ticket...</p>
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-slate-200 bg-white p-8 text-center"
      data-testid="ticket-detail-error"
    >
      <UIcon
        :name="error === 'request-failed' ? 'i-heroicons-wifi' : 'i-heroicons-document-magnifying-glass'"
        class="mx-auto h-10 w-10 text-slate-400"
      />

      <template v-if="error === 'not-found'">
        <h1 class="mt-4 text-xl font-bold text-slate-950">Ticket no encontrado</h1>
        <p class="mt-2 text-sm text-slate-600">
          No encontramos un ticket disponible con ese radicado.
        </p>
      </template>

      <template v-else-if="error === 'invalid-radicado'">
        <h1 class="mt-4 text-xl font-bold text-slate-950">Radicado no válido</h1>
        <p class="mt-2 text-sm text-slate-600">
          Verifica el número del radicado e intenta nuevamente.
        </p>
      </template>

      <template v-else>
        <h1 class="mt-4 text-xl font-bold text-slate-950">No fue posible cargar el ticket</h1>
        <p class="mt-2 text-sm text-slate-600">
          Revisa tu conexión e intenta nuevamente.
        </p>
        <UButton
          class="mt-4"
          color="primary"
          variant="soft"
          icon="i-heroicons-arrow-path"
          data-testid="retry-ticket-detail"
          @click="retry"
        >
          Reintentar
        </UButton>
      </template>
    </div>

    <template v-else-if="ticket">
      <header class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-primary-600">Detalle del ticket</p>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {{ ticket.asunto }}
            </h1>

            <div class="mt-4 flex flex-wrap items-center gap-2">
              <UBadge :color="statusPresentation.color" variant="subtle">
                {{ statusPresentation.label }}
              </UBadge>
              <UBadge :color="priorityPresentation.color" variant="subtle">
                Prioridad {{ priorityPresentation.label.toLowerCase() }}
              </UBadge>
            </div>
          </div>

          <div class="rounded-lg bg-slate-50 p-4 lg:min-w-64">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Radicado</p>
            <div class="mt-2 flex items-center justify-between gap-3">
              <span class="font-mono text-sm font-bold text-slate-950 sm:text-base">
                {{ ticket.radicado }}
              </span>
              <button
                type="button"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-primary-600 hover:bg-primary-50"
                aria-label="Copiar radicado"
                data-testid="copy-ticket-radicado"
                @click="copyRadicado"
              >
                <UIcon name="i-heroicons-clipboard-document" class="h-5 w-5" />
              </button>
            </div>
            <p
              v-if="copyFeedback !== 'idle'"
              class="mt-2 text-xs font-medium"
              :class="copyFeedback === 'copied' ? 'text-green-700' : 'text-red-700'"
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

      <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div class="space-y-6">
          <article class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 class="text-lg font-bold text-slate-950">Información reportada</h2>

            <dl class="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Módulo</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">{{ moduleName }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Pantalla o documento</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">
                  {{ ticket.pestana_o_documento }}
                </dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Canal de origen</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">{{ ticket.canal_origen }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha de creación</dt>
                <dd class="mt-1 text-sm font-medium text-slate-900">
                  {{ formatTicketDateTime(ticket.fecha_creacion) }}
                </dd>
              </div>
            </dl>

            <div class="mt-6 border-t border-slate-100 pt-5">
              <h3 class="text-sm font-semibold text-slate-900">Descripción</h3>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {{ ticket.descripcion }}
              </p>
            </div>

            <div
              v-if="ticket.mensaje_error"
              class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4"
            >
              <h3 class="text-sm font-semibold text-amber-900">Mensaje del sistema reportado</h3>
              <p class="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-amber-900">
                {{ ticket.mensaje_error }}
              </p>
            </div>
          </article>

          <article
            v-if="ticket.estado === 'Resuelto'"
            class="rounded-xl border border-green-200 bg-green-50 p-5 sm:p-6"
            data-testid="solution-card"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 h-6 w-6 shrink-0 text-green-700" />
              <div>
                <h2 class="text-lg font-bold text-green-950">Solución</h2>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-green-900">
                  {{ ticket.comentario_solucion || 'La solución aún no está disponible.' }}
                </p>
                <p v-if="ticket.fecha_resolucion" class="mt-3 text-xs font-medium text-green-800">
                  Resuelto el {{ formatTicketDateTime(ticket.fecha_resolucion) }}
                </p>
              </div>
            </div>
          </article>

          <article
            v-if="ticket.estado === 'No procedente'"
            class="rounded-xl border border-slate-300 bg-slate-50 p-5 sm:p-6"
            data-testid="non-proceeding-card"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-information-circle" class="mt-0.5 h-6 w-6 shrink-0 text-slate-600" />
              <div>
                <h2 class="text-lg font-bold text-slate-950">Motivo de no procedencia</h2>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {{ ticket.motivo_no_procedente || 'El motivo aún no está disponible.' }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <aside class="h-fit rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 class="text-lg font-bold text-slate-950">Estado del ticket</h2>
          <ol class="mt-6 space-y-0" data-testid="ticket-timeline">
            <li
              v-for="(item, index) in timeline"
              :key="`${item.label}-${index}`"
              class="relative flex gap-4 pb-7 last:pb-0"
            >
              <span
                v-if="index < timeline.length - 1"
                class="absolute left-[0.6875rem] top-6 h-[calc(100%-1.5rem)] w-px"
                :class="item.state === 'pending' ? 'bg-slate-200' : 'bg-primary-300'"
              />
              <span
                class="relative mt-0.5 h-6 w-6 shrink-0 rounded-full border-4"
                :class="{
                  'border-primary-100 bg-primary-600': item.state === 'current',
                  'border-green-100 bg-green-600': item.state === 'completed',
                  'border-slate-100 bg-slate-300': item.state === 'pending',
                }"
              />
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ item.label }}</p>
                <p class="mt-1 text-xs leading-5 text-slate-500">{{ item.description }}</p>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </template>
  </section>
</template>
