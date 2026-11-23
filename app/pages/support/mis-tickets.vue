<script setup lang="ts">
import { onMounted } from 'vue'
import { useAssignedTickets } from '~/composables/useAssignedTickets'
import type { AssignedTicketFilter } from '~/services/assignedTicketService'
import {
  formatTicketDateTime,
  getTicketPriorityPresentation,
  getTicketStatusPresentation,
} from '~/utils/ticketPresentation'

definePageMeta({ middleware: 'support' })
useHead({ title: 'Mis tickets asignados — Tickets Datak' })

const {
  tickets, filter, currentPage, totalTickets,
  hasNextPage, hasPreviousPage, isLoading, error,
  loadTickets, changeFilter, changePage,
} = useAssignedTickets()

const statusFilters: Array<{ label: string; value: AssignedTicketFilter }> = [
  { label: 'En gestión', value: 'En gestion' },
  { label: 'Resueltos', value: 'Resuelto' },
  { label: 'Todos', value: null },
]

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

onMounted(() => { void loadTickets() })
</script>

<template>
  <section class="space-y-6" data-testid="assigned-tickets-page">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Consola de soporte</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">Mis tickets asignados</h1>
        <p class="mt-2 text-sm text-muted">Consulta los casos a tu cargo y accede al detalle para registrar avances o resolverlos.</p>
      </div>
      <UButton to="/support/tickets" color="gray" variant="outline" icon="i-lucide-arrow-left" class="self-start">
        Bandeja de soporte
      </UButton>
    </header>

    <div class="rounded-xl border border-default bg-default p-4 shadow-sm sm:p-5">
      <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar mis tickets por estado">
        <UButton
          v-for="option in statusFilters"
          :key="option.label"
          size="sm"
          :color="filter === option.value ? 'primary' : 'gray'"
          :variant="filter === option.value ? 'soft' : 'ghost'"
          :class="filter === option.value ? 'border border-primary-200 dark:border-primary-800' : ''"
          :disabled="isLoading"
          :aria-pressed="filter === option.value"
          @click="changeFilter(option.value)"
        >
          {{ option.label }}
        </UButton>
      </div>
    </div>

    <div v-if="isLoading" class="rounded-xl border border-default bg-default p-10 text-center shadow-sm" data-testid="assigned-tickets-loading" role="status">
      <UIcon name="i-lucide-loader-2" class="mx-auto h-7 w-7 animate-spin text-primary-500" />
      <p class="mt-3 text-sm text-muted">Cargando mis tickets asignados...</p>
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50/70 p-6 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300" data-testid="assigned-tickets-error" role="alert">
      <p>{{ error }}</p>
      <UButton color="red" variant="soft" size="sm" class="mt-3" icon="i-lucide-rotate-cw" @click="loadTickets">Reintentar</UButton>
    </div>

    <div v-else-if="tickets.length === 0" class="rounded-xl border border-dashed border-default bg-default px-5 py-12 text-center" data-testid="assigned-tickets-empty">
      <UIcon name="i-lucide-inbox" class="mx-auto h-9 w-9 text-dimmed" />
      <h2 class="mt-3 text-base font-semibold text-highlighted">Sin tickets asignados</h2>
      <p class="mt-2 text-sm text-muted">No tienes tickets que coincidan con el estado seleccionado.</p>
    </div>

    <template v-else>
      <div class="hidden overflow-hidden rounded-xl border border-default bg-default shadow-sm md:block">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-default text-left text-sm" data-testid="assigned-tickets-table">
            <thead class="bg-muted text-[11px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" class="px-4 py-2.5">Radicado</th>
                <th scope="col" class="px-4 py-2.5">Incidencia</th>
                <th scope="col" class="px-4 py-2.5">Empresa</th>
                <th scope="col" class="px-4 py-2.5">Prioridad</th>
                <th scope="col" class="px-4 py-2.5">Estado</th>
                <th scope="col" class="px-4 py-2.5">Creación</th>
                <th scope="col" class="px-4 py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="ticket in tickets" :key="ticket.id" class="hover:bg-muted/60 transition-colors">
                <td class="whitespace-nowrap px-4 py-3 font-mono tabular-nums text-xs font-semibold text-primary-600 dark:text-primary-400">{{ ticket.radicado }}</td>
                <td class="max-w-xs px-4 py-3">
                  <p class="truncate text-xs font-medium text-highlighted" :title="ticket.asunto">{{ ticket.asunto }}</p>
                  <p class="mt-0.5 truncate text-[11px] text-muted">{{ ticket.modulo?.nombre || 'Módulo no disponible' }}</p>
                </td>
                <td class="px-4 py-3 text-xs text-default">{{ ticket.empresa?.nombre || '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3">
                  <UBadge :color="getTicketPriorityPresentation(ticket.prioridad).color" variant="subtle" size="xs" class="font-medium">
                    <UIcon :name="getPriorityIcon(ticket.prioridad)" class="mr-1 h-3 w-3" />
                    {{ getTicketPriorityPresentation(ticket.prioridad).label }}
                  </UBadge>
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  <UBadge :color="getTicketStatusPresentation(ticket.estado).color" variant="subtle" size="xs" class="font-medium">
                    <UIcon :name="getStatusIcon(ticket.estado)" class="mr-1 h-3 w-3" />
                    {{ getTicketStatusPresentation(ticket.estado).label }}
                  </UBadge>
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-xs text-muted tabular-nums">{{ formatTicketDateTime(ticket.fecha_creacion) }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-right">
                  <UButton :to="`/support/tickets/${ticket.id}`" color="gray" variant="ghost" size="xs" icon="i-lucide-arrow-up-right">Ver detalle</UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-3 md:hidden" data-testid="assigned-tickets-mobile">
        <article v-for="ticket in tickets" :key="ticket.id" class="rounded-xl border border-default bg-default p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="break-all font-mono tabular-nums text-xs font-semibold text-primary-600 dark:text-primary-400">{{ ticket.radicado }}</span>
            <UBadge :color="getTicketStatusPresentation(ticket.estado).color" variant="subtle" size="xs">
              <UIcon :name="getStatusIcon(ticket.estado)" class="mr-1 h-3 w-3" />
              {{ getTicketStatusPresentation(ticket.estado).label }}
            </UBadge>
          </div>
          <h2 class="mt-3 break-words text-sm font-semibold text-highlighted">{{ ticket.asunto }}</h2>
          <p class="mt-1 text-xs text-muted">{{ ticket.empresa?.nombre || 'Empresa no disponible' }} · {{ ticket.modulo?.nombre || 'Módulo no disponible' }}</p>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
            <UBadge :color="getTicketPriorityPresentation(ticket.prioridad).color" variant="subtle" size="xs">
              <UIcon :name="getPriorityIcon(ticket.prioridad)" class="mr-1 h-3 w-3" />
              {{ getTicketPriorityPresentation(ticket.prioridad).label }}
            </UBadge>
            <UButton :to="`/support/tickets/${ticket.id}`" size="xs" color="gray" variant="outline">Ver detalle</UButton>
          </div>
        </article>
      </div>
    </template>

    <footer v-if="!isLoading && !error && (tickets.length > 0 || hasPreviousPage)" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-default px-4 py-3 text-xs text-muted shadow-sm tabular-nums">
      <p>{{ totalTickets }} tickets · Página {{ currentPage }}</p>
      <div class="flex items-center gap-2">
        <UButton size="xs" color="gray" variant="outline" :disabled="!hasPreviousPage" data-testid="assigned-prev" @click="changePage(-1)">Anterior</UButton>
        <UButton size="xs" color="gray" variant="outline" :disabled="!hasNextPage" data-testid="assigned-next" @click="changePage(1)">Siguiente</UButton>
      </div>
    </footer>
  </section>
</template>
