<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useClientTickets } from '~/composables/useClientTickets'
import type { TicketPriority, TicketStatus } from '~/services/ticketService'
import ListToolbarGrid from '~/components/list/ToolbarGrid.vue'
import FilterChip from '~/components/filter/FilterChip.vue'
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

const searchQuery = ref('')

const filteredTickets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return tickets.value
  return tickets.value.filter(
    (t) =>
      t.radicado.toLowerCase().includes(query) ||
      t.asunto.toLowerCase().includes(query) ||
      t.modulo_nombre.toLowerCase().includes(query),
  )
})

const columns = [
  { key: 'radicado', label: 'Radicado' },
  { key: 'asunto', label: 'Asunto' },
  { key: 'modulo', label: 'Módulo' },
  { key: 'prioridad', label: 'Prioridad' },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'actions', label: '' },
]

function getStatusIcon(estado: TicketStatus) {
  switch (estado) {
    case 'Abierto':
      return 'i-lucide-circle-dot'
    case 'En gestion':
      return 'i-lucide-clock'
    case 'Resuelto':
      return 'i-lucide-check-circle-2'
    case 'No procedente':
      return 'i-lucide-slash'
    default:
      return 'i-lucide-circle'
  }
}

function getPriorityIcon(prioridad: TicketPriority) {
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

onMounted(() => {
  void loadTickets()
})
</script>

<template>
  <section class="space-y-5">
    <!-- Header: Título y contexto -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
        Mis tickets
      </h1>
      <p class="mt-1 text-xs text-muted">
        Consulta el estado y el avance de tus solicitudes de soporte técnico.
      </p>
    </div>

    <!-- Barra estándar Datak: ListToolbarGrid con buscador a 4 cols y 1 único UButton solid primary -->
    <ListToolbarGrid
      v-model:search="searchQuery"
      placeholder="Buscar por asunto, módulo o radicado..."
    >
      <template #actions>
        <UButton
          to="/tickets/nuevo"
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
        >
          Radicar Ticket
        </UButton>
      </template>

      <!-- Filtro de estado mediante FilterChip (sin texto 'Filtro por') -->
      <template #filters>
        <div
          class="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Filtrar tickets por estado"
        >
          <FilterChip
            v-for="filter in statusFilters"
            :key="filter.label"
            :label="filter.label"
            :active="selectedStatus === filter.value"
            :clearable="selectedStatus === filter.value && filter.value !== null"
            :disabled="isLoading"
            @click="selectStatus(filter.value)"
            @clear="selectStatus(null)"
          />
        </div>
      </template>
    </ListToolbarGrid>

    <!-- Error State -->
    <div
      v-if="errorMessage"
      role="alert"
      class="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 p-4"
      data-testid="tickets-error"
    >
      <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ errorMessage }}</p>
      <UButton
        class="mt-3"
        size="xs"
        color="red"
        variant="soft"
        icon="i-lucide-refresh-cw"
        @click="loadTickets"
      >
        Reintentar
      </UButton>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="isLoading"
      class="rounded-xl border border-default bg-default p-8 text-center"
      data-testid="tickets-loading"
    >
      <UIcon name="i-lucide-loader-circle" class="mx-auto h-7 w-7 animate-spin text-primary-600" />
      <p class="mt-3 text-xs text-muted">Cargando tickets...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredTickets.length === 0"
      class="rounded-xl border border-dashed border-default bg-default p-8 text-center"
      data-testid="tickets-empty"
    >
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted">
        <UIcon name="i-lucide-inbox" class="h-6 w-6" />
      </div>
      <h2 class="mt-3 text-sm font-semibold text-highlighted">No hay tickets para mostrar</h2>
      <p class="mt-1 text-xs text-muted">
        {{ searchQuery
          ? 'No hay tickets que coincidan con la búsqueda ingresada.'
          : selectedStatus
            ? 'No encontramos tickets con el estado seleccionado.'
            : 'Cuando reportes una incidencia aparecerá en esta lista.' }}
      </p>
    </div>

    <!-- Data Loaded: Table & Mobile Cards -->
    <template v-else>
      <!-- Desktop Table (UTable estilizada con th en bg-muted, badges subtle con Lucide y radicados en tabular-nums) -->
      <div class="hidden overflow-hidden rounded-xl border border-default bg-default shadow-xs md:block">
        <UTable
          :columns="columns"
          :rows="filteredTickets"
          :loading="isLoading"
          data-testid="tickets-table"
          :ui="{
            wrapper: 'relative overflow-x-auto',
            base: 'min-w-full divide-y divide-default',
            thead: 'bg-muted',
            th: {
              base: 'text-left rtl:text-right',
              padding: 'py-2.5 px-4',
              color: 'text-muted',
              font: 'font-semibold text-[11px] uppercase tracking-wide',
            },
            tbody: 'divide-y divide-default bg-default',
            tr: {
              base: 'hover:bg-muted/50 transition-colors',
            },
            td: {
              base: 'whitespace-nowrap',
              padding: 'py-3 px-4',
              color: 'text-default',
              size: 'text-xs',
            },
          }"
        >
          <!-- Radicado column with tabular-nums -->
          <template #radicado-data="{ row }">
            <span class="font-mono text-xs font-semibold text-primary-700 dark:text-primary-400 tabular-nums">
              {{ row.radicado }}
            </span>
          </template>

          <!-- Asunto column -->
          <template #asunto-data="{ row }">
            <div class="max-w-xs truncate text-xs font-medium text-highlighted" :title="row.asunto">
              {{ row.asunto }}
            </div>
          </template>

          <!-- Módulo column -->
          <template #modulo-data="{ row }">
            <span class="text-xs text-muted">{{ row.modulo_nombre }}</span>
          </template>

          <!-- Prioridad column: subtle badge con icono Lucide y sin emojis -->
          <template #prioridad-data="{ row }">
            <UBadge
              :color="getTicketPriorityPresentation(row.prioridad).color"
              variant="subtle"
              size="xs"
              class="inline-flex items-center gap-1 font-medium"
            >
              <UIcon :name="getPriorityIcon(row.prioridad)" class="h-3 w-3" />
              <span>{{ getTicketPriorityPresentation(row.prioridad).label }}</span>
            </UBadge>
          </template>

          <!-- Estado column: subtle badge con icono Lucide y sin emojis -->
          <template #estado-data="{ row }">
            <UBadge
              :color="getTicketStatusPresentation(row.estado).color"
              variant="subtle"
              size="xs"
              class="inline-flex items-center gap-1 font-medium"
            >
              <UIcon :name="getStatusIcon(row.estado)" class="h-3 w-3" />
              <span>{{ getTicketStatusPresentation(row.estado).label }}</span>
            </UBadge>
          </template>

          <!-- Fecha column in tabular-nums -->
          <template #fecha-data="{ row }">
            <span class="text-xs text-muted tabular-nums">
              {{ formatTicketDate(row.fecha_creacion) }}
            </span>
          </template>

          <!-- Acciones column -->
          <template #actions-data="{ row }">
            <div class="text-right">
              <NuxtLink
                :to="`/tickets/${row.radicado}`"
                class="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 transition-colors"
              >
                Ver detalle
                <UIcon name="i-lucide-chevron-right" class="h-3 w-3" />
              </NuxtLink>
            </div>
          </template>
        </UTable>
      </div>

      <!-- Mobile List Cards -->
      <div class="grid gap-3 md:hidden" data-testid="tickets-mobile-list">
        <article
          v-for="ticket in filteredTickets"
          :key="ticket.radicado"
          class="rounded-xl border border-default bg-default p-4 shadow-xs"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-mono text-xs font-semibold text-primary-700 dark:text-primary-400 tabular-nums">
                {{ ticket.radicado }}
              </p>
              <h2 class="mt-1 line-clamp-2 text-sm font-semibold text-highlighted">
                {{ ticket.asunto }}
              </h2>
            </div>
            <UBadge
              :color="getTicketStatusPresentation(ticket.estado).color"
              variant="subtle"
              size="xs"
              class="inline-flex items-center gap-1 font-medium shrink-0"
            >
              <UIcon :name="getStatusIcon(ticket.estado)" class="h-3 w-3" />
              <span>{{ getTicketStatusPresentation(ticket.estado).label }}</span>
            </UBadge>
          </div>

          <dl class="mt-3.5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt class="text-muted">Módulo</dt>
              <dd class="mt-0.5 font-medium text-default">{{ ticket.modulo_nombre }}</dd>
            </div>
            <div>
              <dt class="text-muted">Prioridad</dt>
              <dd class="mt-0.5">
                <UBadge
                  :color="getTicketPriorityPresentation(ticket.prioridad).color"
                  variant="subtle"
                  size="xs"
                  class="inline-flex items-center gap-1 font-medium"
                >
                  <UIcon :name="getPriorityIcon(ticket.prioridad)" class="h-3 w-3" />
                  <span>{{ getTicketPriorityPresentation(ticket.prioridad).label }}</span>
                </UBadge>
              </dd>
            </div>
            <div class="col-span-2">
              <dt class="text-muted">Fecha</dt>
              <dd class="mt-0.5 font-medium text-default tabular-nums">
                {{ formatTicketDate(ticket.fecha_creacion) }}
              </dd>
            </div>
          </dl>

          <NuxtLink
            :to="`/tickets/${ticket.radicado}`"
            class="mt-3.5 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
          >
            Ver detalle
            <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
          </NuxtLink>
        </article>
      </div>

      <!-- Paginación -->
      <div class="flex flex-col gap-3 rounded-xl border border-default bg-default px-4 py-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <p class="text-xs text-muted tabular-nums">
          {{ totalTickets }} {{ totalTickets === 1 ? 'ticket' : 'tickets' }} · Página {{ currentPage }} de {{ totalPages }}
        </p>
        <div class="flex gap-2">
          <UButton
            color="gray"
            variant="outline"
            size="xs"
            icon="i-lucide-chevron-left"
            :disabled="!hasPreviousPage || isLoading"
            data-testid="previous-page"
            @click="selectPage(currentPage - 1)"
          >
            Anterior
          </UButton>
          <UButton
            color="gray"
            variant="outline"
            size="xs"
            trailing-icon="i-lucide-chevron-right"
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
