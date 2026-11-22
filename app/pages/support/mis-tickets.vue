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

onMounted(() => { void loadTickets() })
</script>

<template>
  <section class="space-y-6" data-testid="assigned-tickets-page">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-amber-600">Consola de soporte</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Mis tickets asignados</h1>
        <p class="mt-2 text-sm text-slate-600">Consulta los casos a tu cargo y accede al detalle para registrar avances o resolverlos.</p>
      </div>
      <UButton to="/support/tickets" color="gray" variant="outline" icon="i-heroicons-arrow-left" class="self-start">
        Bandeja de soporte
      </UButton>
    </header>

    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar mis tickets por estado">
        <UButton
          v-for="option in statusFilters"
          :key="option.label"
          size="sm"
          :color="filter === option.value ? 'primary' : 'gray'"
          :variant="filter === option.value ? 'soft' : 'ghost'"
          :disabled="isLoading"
          :aria-pressed="filter === option.value"
          @click="changeFilter(option.value)"
        >
          {{ option.label }}
        </UButton>
      </div>
    </div>

    <div v-if="isLoading" class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm" data-testid="assigned-tickets-loading" role="status">
      <UIcon name="i-heroicons-arrow-path" class="mx-auto h-7 w-7 animate-spin text-primary-600" />
      <p class="mt-3 text-sm text-slate-600">Cargando mis tickets asignados...</p>
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800" data-testid="assigned-tickets-error" role="alert">
      <p>{{ error }}</p>
      <UButton color="red" variant="soft" size="sm" class="mt-3" icon="i-heroicons-arrow-path" @click="loadTickets">Reintentar</UButton>
    </div>

    <div v-else-if="tickets.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center" data-testid="assigned-tickets-empty">
      <UIcon name="i-heroicons-inbox" class="mx-auto h-9 w-9 text-slate-400" />
      <h2 class="mt-3 text-base font-semibold text-slate-950">Sin tickets asignados</h2>
      <p class="mt-2 text-sm text-slate-600">No tienes tickets que coincidan con el estado seleccionado.</p>
    </div>

    <template v-else>
      <div class="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-left text-sm" data-testid="assigned-tickets-table">
            <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" class="px-4 py-3">Radicado</th>
                <th scope="col" class="px-4 py-3">Incidencia</th>
                <th scope="col" class="px-4 py-3">Empresa</th>
                <th scope="col" class="px-4 py-3">Prioridad</th>
                <th scope="col" class="px-4 py-3">Estado</th>
                <th scope="col" class="px-4 py-3">Creación</th>
                <th scope="col" class="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="ticket in tickets" :key="ticket.id" class="hover:bg-slate-50/70">
                <td class="whitespace-nowrap px-4 py-4 font-mono text-xs font-semibold text-primary-700">{{ ticket.radicado }}</td>
                <td class="max-w-xs px-4 py-4">
                  <p class="truncate font-medium text-slate-900" :title="ticket.asunto">{{ ticket.asunto }}</p>
                  <p class="mt-1 truncate text-xs text-slate-500">{{ ticket.modulo?.nombre || 'Módulo no disponible' }}</p>
                </td>
                <td class="px-4 py-4 text-xs text-slate-700">{{ ticket.empresa?.nombre || '—' }}</td>
                <td class="whitespace-nowrap px-4 py-4"><UBadge :color="getTicketPriorityPresentation(ticket.prioridad).color" variant="subtle">{{ getTicketPriorityPresentation(ticket.prioridad).label }}</UBadge></td>
                <td class="whitespace-nowrap px-4 py-4"><UBadge :color="getTicketStatusPresentation(ticket.estado).color" variant="subtle">{{ getTicketStatusPresentation(ticket.estado).label }}</UBadge></td>
                <td class="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{{ formatTicketDateTime(ticket.fecha_creacion) }}</td>
                <td class="whitespace-nowrap px-4 py-4">
                  <UButton :to="`/support/tickets/${ticket.id}`" color="primary" variant="soft" size="xs" icon="i-heroicons-arrow-top-right-on-square">Ver detalle</UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-3 md:hidden" data-testid="assigned-tickets-mobile">
        <article v-for="ticket in tickets" :key="ticket.id" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="break-all font-mono text-xs font-semibold text-primary-700">{{ ticket.radicado }}</span>
            <UBadge :color="getTicketStatusPresentation(ticket.estado).color" variant="subtle">{{ getTicketStatusPresentation(ticket.estado).label }}</UBadge>
          </div>
          <h2 class="mt-3 break-words text-sm font-semibold text-slate-900">{{ ticket.asunto }}</h2>
          <p class="mt-1 text-xs text-slate-500">{{ ticket.empresa?.nombre || 'Empresa no disponible' }} · {{ ticket.modulo?.nombre || 'Módulo no disponible' }}</p>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <UBadge :color="getTicketPriorityPresentation(ticket.prioridad).color" variant="subtle">{{ getTicketPriorityPresentation(ticket.prioridad).label }}</UBadge>
            <UButton :to="`/support/tickets/${ticket.id}`" size="xs" color="primary" variant="soft">Ver detalle</UButton>
          </div>
        </article>
      </div>
    </template>

    <footer v-if="!isLoading && !error && (tickets.length > 0 || hasPreviousPage)" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
      <p>{{ totalTickets }} tickets · Página {{ currentPage }}</p>
      <div class="flex items-center gap-2">
        <UButton size="xs" color="gray" variant="outline" :disabled="!hasPreviousPage" data-testid="assigned-prev" @click="changePage(-1)">Anterior</UButton>
        <UButton size="xs" color="gray" variant="outline" :disabled="!hasNextPage" data-testid="assigned-next" @click="changePage(1)">Siguiente</UButton>
      </div>
    </footer>
  </section>
</template>
