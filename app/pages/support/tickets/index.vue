<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSupportTickets } from '~/composables/useSupportTickets'
import type { TicketPriority, TicketStatus } from '~/services/ticketService'
import ListToolbarGrid from '~/components/list/ToolbarGrid.vue'
import FilterChip from '~/components/filter/FilterChip.vue'
import {
  formatTicketDate,
  getTicketPriorityPresentation,
  getTicketStatusPresentation,
} from '~/utils/ticketPresentation'

definePageMeta({
  middleware: 'support',
})

useHead({
  title: 'Bandeja de soporte — Tickets Datak',
})

const {
  tickets,
  totalTickets,
  currentPage,
  totalPages,
  isLoading,
  errorMessage,
  selectedEmpresa,
  selectedStatus,
  selectedPriority,
  selectedChannel,
  empresas,
  isLoadingEmpresas,
  hasPreviousPage,
  hasNextPage,
  loadEmpresas,
  loadTickets,
  setEmpresa,
  setStatus,
  setPriority,
  setChannel,
  setSearch,
  clearFilters,
  selectPage,
} = useSupportTickets()

const localSearch = ref('')
let searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null

const onSearchInput = (value: string) => {
  localSearch.value = value
  if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout)
  searchDebounceTimeout = setTimeout(() => {
    void setSearch(value)
  }, 400)
}

const statusOptions: Array<{ label: string; value: TicketStatus | null }> = [
  { label: 'Todos los estados', value: null },
  { label: 'Abierto', value: 'Abierto' },
  { label: 'En gestión', value: 'En gestion' },
  { label: 'Resuelto', value: 'Resuelto' },
  { label: 'No procedente', value: 'No procedente' },
]

const priorityOptions: Array<{ label: string; value: TicketPriority | null }> = [
  { label: 'Todas las prioridades', value: null },
  { label: 'Baja', value: 'Baja' },
  { label: 'Media', value: 'Media' },
  { label: 'Alta', value: 'Alta' },
  { label: 'Crítica', value: 'Critica' },
]

const channelOptions = [
  { label: 'Todos los canales', value: null },
  { label: 'Portal', value: 'Portal' },
  { label: 'Chatbot', value: 'Chatbot' },
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Slack', value: 'Slack' },
  { label: 'Correo', value: 'Correo' },
  { label: 'Otro', value: 'Otro' },
]

const selectedEmpresaNombre = computed(() => {
  if (!selectedEmpresa.value) return null
  return empresas.value.find((e) => e.id === selectedEmpresa.value)?.nombre ?? null
})

const selectedStatusLabel = computed(() => {
  if (!selectedStatus.value) return null
  return statusOptions.find((o) => o.value === selectedStatus.value)?.label ?? null
})

const selectedPriorityLabel = computed(() => {
  if (!selectedPriority.value) return null
  return priorityOptions.find((o) => o.value === selectedPriority.value)?.label ?? null
})

const selectedChannelLabel = computed(() => {
  if (!selectedChannel.value) return null
  return selectedChannel.value
})

const hasActiveFilters = computed(() => {
  return Boolean(
    selectedEmpresa.value ||
    selectedStatus.value ||
    selectedPriority.value ||
    selectedChannel.value ||
    localSearch.value.trim()
  )
})

const columns = [
  { key: 'radicado', label: 'Radicado' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'asunto', label: 'Asunto y Módulo' },
  { key: 'canal', label: 'Canal' },
  { key: 'prioridad', label: 'Prioridad' },
  { key: 'estado', label: 'Estado' },
  { key: 'responsable', label: 'Responsable' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'actions', label: '' },
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

const getChannelIcon = (canal?: string): string => {
  switch (canal?.toLowerCase()) {
    case 'portal':
      return 'i-lucide-globe'
    case 'chatbot':
      return 'i-lucide-bot'
    case 'whatsapp':
      return 'i-lucide-message-circle'
    case 'slack':
      return 'i-lucide-hash'
    case 'correo':
      return 'i-lucide-mail'
    default:
      return 'i-lucide-send'
  }
}

const handleResetFilters = async () => {
  localSearch.value = ''
  await clearFilters()
}

onMounted(async () => {
  await Promise.all([loadEmpresas(), loadTickets()])
})
</script>

<template>
  <div class="space-y-5">
    <!-- Header Section -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Consola de soporte</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
          Bandeja unificada de soporte
        </h1>
        <p class="mt-0.5 text-xs text-muted">
          Gestión centralizada, triaje multitenant y asignación de tickets de clientes.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <UButton
          to="/support/tickets/nuevo"
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          class="w-full justify-center sm:w-auto font-medium"
        >
          Registrar ticket externo
        </UButton>
      </div>
    </div>

    <!-- Toolbar Grid with Search and Superdatak FilterChips -->
    <ListToolbarGrid
      v-model:search="localSearch"
      placeholder="Radicado, asunto o empresa..."
      @update:search="onSearchInput"
    >
      <template #filters>
        <div class="flex flex-wrap items-center gap-2">
          <!-- Empresa Filter Chip with Native Accessible Select Overlay -->
          <div class="relative inline-flex items-center">
            <FilterChip
              label="Empresa"
              :display="selectedEmpresaNombre"
              :active="Boolean(selectedEmpresa)"
              :clearable="Boolean(selectedEmpresa)"
              :chevron="!selectedEmpresa"
              :disabled="isLoading || isLoadingEmpresas"
              @clear="setEmpresa(null)"
            />
            <select
              :value="selectedEmpresa ?? ''"
              aria-label="Filtrar por empresa"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              :disabled="isLoading || isLoadingEmpresas"
              @change="setEmpresa(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
            >
              <option value="">Todas las empresas</option>
              <option
                v-for="emp in empresas"
                :key="emp.id"
                :value="emp.id"
              >
                {{ emp.nombre }}
              </option>
            </select>
          </div>

          <!-- Estado Filter Chip with Native Accessible Select Overlay -->
          <div class="relative inline-flex items-center">
            <FilterChip
              label="Estado"
              :display="selectedStatusLabel"
              :active="Boolean(selectedStatus)"
              :clearable="Boolean(selectedStatus)"
              :chevron="!selectedStatus"
              :disabled="isLoading"
              @clear="setStatus(null)"
            />
            <select
              :value="selectedStatus ?? ''"
              aria-label="Filtrar por estado"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              :disabled="isLoading"
              @change="setStatus((($event.target as HTMLSelectElement).value as TicketStatus) || null)"
            >
              <option
                v-for="opt in statusOptions"
                :key="opt.label"
                :value="opt.value ?? ''"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Prioridad Filter Chip with Native Accessible Select Overlay -->
          <div class="relative inline-flex items-center">
            <FilterChip
              label="Prioridad"
              :display="selectedPriorityLabel"
              :active="Boolean(selectedPriority)"
              :clearable="Boolean(selectedPriority)"
              :chevron="!selectedPriority"
              :disabled="isLoading"
              @clear="setPriority(null)"
            />
            <select
              :value="selectedPriority ?? ''"
              aria-label="Filtrar por prioridad"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              :disabled="isLoading"
              @change="setPriority((($event.target as HTMLSelectElement).value as TicketPriority) || null)"
            >
              <option
                v-for="opt in priorityOptions"
                :key="opt.label"
                :value="opt.value ?? ''"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Canal Filter Chip with Native Accessible Select Overlay -->
          <div class="relative inline-flex items-center">
            <FilterChip
              label="Canal"
              :display="selectedChannelLabel"
              :active="Boolean(selectedChannel)"
              :clearable="Boolean(selectedChannel)"
              :chevron="!selectedChannel"
              :disabled="isLoading"
              @clear="setChannel(null)"
            />
            <select
              :value="selectedChannel ?? ''"
              aria-label="Filtrar por canal de origen"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              :disabled="isLoading"
              @change="setChannel(($event.target as HTMLSelectElement).value || null)"
            >
              <option
                v-for="opt in channelOptions"
                :key="opt.label"
                :value="opt.value ?? ''"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Reset Filters Button if any active -->
          <UButton
            v-if="hasActiveFilters"
            size="xs"
            color="gray"
            variant="ghost"
            icon="i-lucide-x"
            class="text-xs text-muted hover:text-highlighted"
            title="Restablecer filtros"
            aria-label="Limpiar filtros"
            :disabled="isLoading"
            @click="handleResetFilters"
          >
            Limpiar filtros
          </UButton>
        </div>
      </template>
    </ListToolbarGrid>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      role="alert"
      class="flex items-center justify-between rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 p-4 text-xs sm:text-sm text-red-800 dark:text-red-300"
    >
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-alert-triangle" class="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
        <span>{{ errorMessage }}</span>
      </div>
      <UButton
        color="red"
        variant="ghost"
        size="xs"
        icon="i-lucide-refresh-cw"
        @click="loadTickets"
      >
        Reintentar
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-2 py-4" aria-label="Cargando tickets de soporte">
      <div
        v-for="i in 5"
        :key="i"
        class="h-10 w-full animate-pulse rounded-lg bg-muted"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="tickets.length === 0"
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-default bg-default py-12 text-center"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted">
        <UIcon name="i-lucide-inbox" class="h-6 w-6" />
      </div>
      <h3 class="mt-3 text-sm font-semibold text-highlighted">
        No se encontraron tickets
      </h3>
      <p class="mt-1 max-w-sm text-xs text-muted">
        No hay incidencias que coincidan con los filtros aplicados en la bandeja de soporte.
      </p>
      <UButton
        class="mt-4"
        color="gray"
        variant="outline"
        size="xs"
        icon="i-lucide-rotate-ccw"
        @click="handleResetFilters"
      >
        Restablecer filtros
      </UButton>
    </div>

    <!-- High-Density Desktop Table View (UTable) -->
    <div v-else class="hidden overflow-hidden rounded-xl border border-default bg-default shadow-xs md:block">
      <UTable
        :columns="columns"
        :rows="tickets"
        :loading="isLoading"
        data-testid="support-tickets-table"
        :ui="{
          wrapper: 'relative overflow-x-auto',
          base: 'min-w-full divide-y divide-default',
          thead: 'bg-muted',
          th: {
            base: 'text-left rtl:text-right',
            padding: 'py-2 px-3',
            color: 'text-muted',
            font: 'font-semibold text-[11px] uppercase tracking-wide',
          },
          tbody: 'divide-y divide-default bg-default',
          tr: {
            base: 'hover:bg-muted/50 transition-colors',
          },
          td: {
            base: 'whitespace-nowrap',
            padding: 'py-2 px-3',
            color: 'text-default',
            size: 'text-xs',
          },
        }"
      >
        <!-- Radicado column -->
        <template #radicado-data="{ row }">
          <NuxtLink
            :to="`/support/tickets/${row.id}`"
            class="font-mono text-xs font-semibold text-primary-700 dark:text-primary-400 tabular-nums hover:underline"
          >
            {{ row.radicado }}
          </NuxtLink>
        </template>

        <!-- Empresa column -->
        <template #empresa-data="{ row }">
          <span class="inline-flex max-w-[10rem] truncate text-xs font-medium text-highlighted" :title="row.empresa?.nombre">
            {{ row.empresa?.nombre || '—' }}
          </span>
        </template>

        <!-- Asunto y Módulo column -->
        <template #asunto-data="{ row }">
          <div class="max-w-xs">
            <p class="truncate text-xs font-medium text-highlighted" :title="row.asunto">
              {{ row.asunto }}
            </p>
            <p class="truncate text-[11px] text-muted">
              {{ row.modulo?.nombre || 'Módulo general' }}
            </p>
          </div>
        </template>

        <!-- Canal column -->
        <template #canal-data="{ row }">
          <span class="inline-flex items-center gap-1.5 text-xs text-muted">
            <UIcon :name="getChannelIcon(row.canal_origen)" class="h-3.5 w-3.5 text-muted shrink-0" />
            <span>{{ row.canal_origen || 'Portal' }}</span>
          </span>
        </template>

        <!-- Prioridad column -->
        <template #prioridad-data="{ row }">
          <UBadge
            :color="getTicketPriorityPresentation(row.prioridad).color"
            variant="subtle"
            size="xs"
            class="rounded-md font-medium text-xs"
          >
            <UIcon :name="getPriorityIcon(row.prioridad)" class="w-3 h-3 mr-1" />
            {{ getTicketPriorityPresentation(row.prioridad).label }}
          </UBadge>
        </template>

        <!-- Estado column -->
        <template #estado-data="{ row }">
          <UBadge
            :color="getTicketStatusPresentation(row.estado).color"
            variant="subtle"
            size="xs"
            class="rounded-md font-medium text-xs"
          >
            <UIcon :name="getStatusIcon(row.estado)" class="w-3 h-3 mr-1" />
            {{ getTicketStatusPresentation(row.estado).label }}
          </UBadge>
        </template>

        <!-- Responsable column -->
        <template #responsable-data="{ row }">
          <span
            v-if="row.responsable"
            class="text-xs font-medium text-default"
          >
            {{ row.responsable.nombre }}
          </span>
          <span
            v-else
            class="inline-block rounded bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          >
            Sin asignar
          </span>
        </template>

        <!-- Fecha column -->
        <template #fecha-data="{ row }">
          <span class="text-xs text-muted tabular-nums">
            {{ formatTicketDate(row.fecha_creacion) }}
          </span>
        </template>

        <!-- Accion rápida column -->
        <template #actions-data="{ row }">
          <div class="text-right">
            <UButton
              :to="`/support/tickets/${row.id}`"
              color="gray"
              variant="outline"
              size="xs"
              icon="i-lucide-arrow-up-right"
              class="font-medium"
            >
              Gestionar
            </UButton>
          </div>
        </template>
      </UTable>
    </div>

    <!-- Mobile Card View (md:hidden) -->
    <div v-if="!isLoading && tickets.length > 0" class="space-y-3 md:hidden">
      <article
        v-for="ticket in tickets"
        :key="ticket.id"
        class="rounded-xl border border-default bg-default p-4 shadow-xs"
      >
        <div class="flex items-center justify-between gap-2">
          <NuxtLink
            :to="`/support/tickets/${ticket.id}`"
            class="font-mono text-xs font-semibold text-primary-700 dark:text-primary-400 tabular-nums hover:underline"
          >
            {{ ticket.radicado }}
          </NuxtLink>
          <UBadge
            :color="getTicketStatusPresentation(ticket.estado).color"
            variant="subtle"
            size="xs"
            class="rounded-md font-medium text-xs"
          >
            <UIcon :name="getStatusIcon(ticket.estado)" class="w-3 h-3 mr-1" />
            {{ getTicketStatusPresentation(ticket.estado).label }}
          </UBadge>
        </div>

        <div class="mt-2.5">
          <span class="text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md inline-block border border-amber-200 dark:border-amber-800">
            {{ ticket.empresa?.nombre }}
          </span>
          <h2 class="mt-1 text-sm font-semibold text-highlighted">
            {{ ticket.asunto }}
          </h2>
          <p class="text-xs text-muted">
            {{ ticket.modulo?.nombre }} · Canal: {{ ticket.canal_origen || 'Portal' }}
          </p>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-default pt-2.5 text-xs text-muted">
          <div class="flex items-center gap-1.5">
            <span>Prioridad:</span>
            <UBadge
              :color="getTicketPriorityPresentation(ticket.prioridad).color"
              variant="subtle"
              size="xs"
              class="rounded-md font-medium text-xs"
            >
              <UIcon :name="getPriorityIcon(ticket.prioridad)" class="w-3 h-3 mr-1" />
              {{ getTicketPriorityPresentation(ticket.prioridad).label }}
            </UBadge>
          </div>
          <span class="tabular-nums">
            {{ formatTicketDate(ticket.fecha_creacion) }}
          </span>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-default pt-2.5">
          <span class="text-xs text-default">
            <span class="font-medium text-muted">Responsable:</span>
            {{ ticket.responsable?.nombre || 'Sin asignar' }}
          </span>

          <UButton
            :to="`/support/tickets/${ticket.id}`"
            color="gray"
            variant="outline"
            size="xs"
            icon="i-lucide-arrow-up-right"
            class="font-medium"
          >
            Gestionar
          </UButton>
        </div>
      </article>
    </div>

    <!-- Pagination Footer -->
    <div
      v-if="!isLoading && totalTickets > 0"
      class="flex flex-col items-center justify-between gap-3 rounded-xl border border-default bg-default px-4 py-3 sm:flex-row sm:px-5 shadow-xs"
    >
      <div class="text-xs text-muted">
        Mostrando página <span class="font-semibold text-highlighted tabular-nums">{{ currentPage }}</span> de
        <span class="font-semibold text-highlighted tabular-nums">{{ totalPages }}</span>
        (<span class="font-semibold text-highlighted tabular-nums">{{ totalTickets }}</span> tickets en total)
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="gray"
          variant="outline"
          size="xs"
          icon="i-lucide-chevron-left"
          :disabled="!hasPreviousPage || isLoading"
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
          @click="selectPage(currentPage + 1)"
        >
          Siguiente
        </UButton>
      </div>
    </div>
  </div>
</template>
