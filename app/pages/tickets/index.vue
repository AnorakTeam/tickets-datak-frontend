<script setup lang="ts">
import { onMounted } from 'vue'
import { useClientTickets } from '~/composables/useClientTickets'
import type { TicketStatus } from '~/services/ticketService'
import {
  formatTicketDate,
  getTicketPriorityPresentation,
  getTicketStatusPresentation,
} from '~/utils/ticketPresentation'

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Mis tickets — Tickets Datak',
})

interface StatusFilter {
  label: string
  value: TicketStatus | null
}

const statusFilters: StatusFilter[] = [
  { label: 'Todos', value: null },
  { label: 'Abiertos', value: 'Abierto' },
  { label: 'En gestión', value: 'En gestion' },
  { label: 'Resueltos', value: 'Resuelto' },
  { label: 'No procedentes', value: 'No procedente' },
]

const {
  tickets,
  currentPage,
  selectedStatus,
  totalTickets,
  totalPages,
  isLoading,
  errorMessage,
  hasPreviousPage,
  hasNextPage,
  loadTickets,
  selectStatus,
  selectPage,
} = useClientTickets()

onMounted(() => {
  void loadTickets()
})
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-primary-600">Portal del cliente</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Mis tickets
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Consulta el estado y el avance de tus solicitudes de soporte.
        </p>
      </div>

      <UButton
        to="/tickets/nuevo"
        color="primary"
        icon="i-heroicons-plus"
        class="w-full justify-center sm:w-auto"
      >
        Reportar incidencia
      </UButton>
    </div>

    <div
      class="flex gap-2 overflow-x-auto pb-1"
      role="tablist"
      aria-label="Filtrar tickets por estado"
    >
      <button
        v-for="filter in statusFilters"
        :key="filter.label"
        type="button"
        role="tab"
        :aria-selected="selectedStatus === filter.value"
        class="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
        :class="selectedStatus === filter.value
          ? 'border-primary-600 bg-primary-50 text-primary-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'"
        :disabled="isLoading"
        @click="selectStatus(filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>

    <div
      v-if="errorMessage"
      role="alert"
      class="rounded-xl border border-red-200 bg-red-50 p-4"
      data-testid="tickets-error"
    >
      <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
      <UButton
        class="mt-3"
        size="xs"
        color="red"
        variant="soft"
        icon="i-heroicons-arrow-path"
        @click="loadTickets"
      >
        Reintentar
      </UButton>
    </div>

    <div
      v-else-if="isLoading"
      class="rounded-xl border border-slate-200 bg-white p-8 text-center"
      data-testid="tickets-loading"
    >
      <UIcon name="i-heroicons-arrow-path" class="mx-auto h-7 w-7 animate-spin text-primary-600" />
      <p class="mt-3 text-sm text-slate-600">Cargando tickets...</p>
    </div>

    <div
      v-else-if="tickets.length === 0"
      class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"
      data-testid="tickets-empty"
    >
      <UIcon name="i-heroicons-inbox" class="mx-auto h-10 w-10 text-slate-400" />
      <h2 class="mt-3 text-base font-semibold text-slate-900">No hay tickets para mostrar</h2>
      <p class="mt-1 text-sm text-slate-500">
        {{ selectedStatus
          ? 'No encontramos tickets con el estado seleccionado.'
          : 'Cuando reportes una incidencia aparecerá en esta lista.' }}
      </p>
    </div>

    <template v-else>
      <div class="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200" data-testid="tickets-table">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Radicado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Asunto</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Módulo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Prioridad</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</th>
                <th class="px-4 py-3"><span class="sr-only">Ver detalle</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="ticket in tickets" :key="ticket.radicado" class="hover:bg-slate-50/70">
                <td class="whitespace-nowrap px-4 py-4 font-mono text-sm font-semibold text-primary-700">
                  {{ ticket.radicado }}
                </td>
                <td class="max-w-xs px-4 py-4 text-sm font-medium text-slate-900">
                  <span class="line-clamp-2">{{ ticket.asunto }}</span>
                </td>
                <td class="px-4 py-4 text-sm text-slate-600">{{ ticket.modulo_nombre }}</td>
                <td class="px-4 py-4">
                  <UBadge
                    :color="getTicketPriorityPresentation(ticket.prioridad).color"
                    variant="subtle"
                    size="sm"
                  >
                    {{ getTicketPriorityPresentation(ticket.prioridad).label }}
                  </UBadge>
                </td>
                <td class="px-4 py-4">
                  <UBadge
                    :color="getTicketStatusPresentation(ticket.estado).color"
                    variant="subtle"
                    size="sm"
                  >
                    {{ getTicketStatusPresentation(ticket.estado).label }}
                  </UBadge>
                </td>
                <td class="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                  {{ formatTicketDate(ticket.fecha_creacion) }}
                </td>
                <td class="px-4 py-4 text-right">
                  <NuxtLink
                    :to="`/tickets/${ticket.radicado}`"
                    class="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Ver detalle
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid gap-3 md:hidden" data-testid="tickets-mobile-list">
        <article
          v-for="ticket in tickets"
          :key="ticket.radicado"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-mono text-xs font-semibold text-primary-700">{{ ticket.radicado }}</p>
              <h2 class="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{{ ticket.asunto }}</h2>
            </div>
            <UBadge
              :color="getTicketStatusPresentation(ticket.estado).color"
              variant="subtle"
              size="sm"
              class="shrink-0"
            >
              {{ getTicketStatusPresentation(ticket.estado).label }}
            </UBadge>
          </div>

          <dl class="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt class="text-slate-500">Módulo</dt>
              <dd class="mt-1 font-medium text-slate-800">{{ ticket.modulo_nombre }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Prioridad</dt>
              <dd class="mt-1 font-medium text-slate-800">
                {{ getTicketPriorityPresentation(ticket.prioridad).label }}
              </dd>
            </div>
            <div>
              <dt class="text-slate-500">Fecha</dt>
              <dd class="mt-1 font-medium text-slate-800">{{ formatTicketDate(ticket.fecha_creacion) }}</dd>
            </div>
          </dl>

          <NuxtLink
            :to="`/tickets/${ticket.radicado}`"
            class="mt-4 inline-flex text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Ver detalle
          </NuxtLink>
        </article>
      </div>

      <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-slate-600">
          {{ totalTickets }} {{ totalTickets === 1 ? 'ticket' : 'tickets' }} · Página {{ currentPage }} de {{ totalPages }}
        </p>
        <div class="flex gap-2">
          <UButton
            color="gray"
            variant="outline"
            icon="i-heroicons-chevron-left"
            :disabled="!hasPreviousPage || isLoading"
            data-testid="previous-page"
            @click="selectPage(currentPage - 1)"
          >
            Anterior
          </UButton>
          <UButton
            color="gray"
            variant="outline"
            trailing-icon="i-heroicons-chevron-right"
            :disabled="!hasNextPage || isLoading"
            data-testid="next-page"
            @click="selectPage(currentPage + 1)"
          >
            Siguiente
          </UButton>
        </div>
      </div>
    </template>
  </section>
</template>
