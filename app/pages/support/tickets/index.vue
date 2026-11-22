<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSupportTickets } from '~/composables/useSupportTickets'
import type { TicketPriority, TicketStatus } from '~/services/ticketService'
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
  searchQuery,
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
let searchDebounceTimeout: any = null

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

const handleResetFilters = async () => {
  localSearch.value = ''
  await clearFilters()
}

onMounted(async () => {
  await Promise.all([loadEmpresas(), loadTickets()])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-amber-600">Consola de soporte</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Bandeja unificada de soporte
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Gestión centralizada, triaje multitenant y asignación de tickets de clientes.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <UButton
          to="/support/tickets/nuevo"
          color="primary"
          icon="i-heroicons-plus"
          class="w-full justify-center sm:w-auto"
        >
          Registrar ticket externo
        </UButton>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <!-- Text Search -->
        <div class="lg:col-span-1">
          <label class="block text-xs font-medium text-slate-600 mb-1">Buscar</label>
          <UInput
            :model-value="localSearch"
            icon="i-heroicons-magnifying-glass"
            placeholder="Radicado o asunto..."
            size="sm"
            @update:model-value="onSearchInput"
          />
        </div>

        <!-- Empresa Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Empresa</label>
          <select
            :value="selectedEmpresa ?? ''"
            class="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
            :disabled="isLoading || isLoadingEmpresas"
            aria-label="Filtrar por empresa"
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

        <!-- Estado Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Estado</label>
          <select
            :value="selectedStatus ?? ''"
            class="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
            :disabled="isLoading"
            aria-label="Filtrar por estado"
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

        <!-- Prioridad Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Prioridad</label>
          <select
            :value="selectedPriority ?? ''"
            class="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
            :disabled="isLoading"
            aria-label="Filtrar por prioridad"
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

        <!-- Canal de Origen Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Canal de origen</label>
          <div class="flex items-center gap-1.5">
            <select
              :value="selectedChannel ?? ''"
              class="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              :disabled="isLoading"
              aria-label="Filtrar por canal de origen"
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

            <UButton
              color="gray"
              variant="soft"
              size="xs"
              icon="i-heroicons-arrow-path"
              title="Limpiar filtros"
              aria-label="Limpiar filtros"
              class="shrink-0"
              :disabled="isLoading"
              @click="handleResetFilters"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      role="alert"
      class="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 shrink-0 text-red-600" />
        <span>{{ errorMessage }}</span>
      </div>
      <UButton
        color="red"
        variant="ghost"
        size="xs"
        @click="loadTickets"
      >
        Reintentar
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-3 py-6" aria-label="Cargando tickets de soporte">
      <div
        v-for="i in 5"
        :key="i"
        class="h-14 w-full animate-pulse rounded-xl bg-slate-100"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="tickets.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <UIcon name="i-heroicons-inbox" class="h-6 w-6" />
      </div>
      <h3 class="mt-3 text-base font-semibold text-slate-800">
        No se encontraron tickets
      </h3>
      <p class="mt-1 max-w-sm text-xs text-slate-500">
        No hay incidencias que coincidan con los filtros aplicados en la bandeja de soporte.
      </p>
      <UButton
        class="mt-4"
        color="gray"
        variant="outline"
        size="xs"
        @click="handleResetFilters"
      >
        Restablecer filtros
      </UButton>
    </div>

    <!-- Desktop / Tablet Table View -->
    <div v-else class="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" class="px-4 py-3">Radicado</th>
              <th scope="col" class="px-4 py-3">Empresa</th>
              <th scope="col" class="px-4 py-3">Asunto y Módulo</th>
              <th scope="col" class="px-4 py-3">Canal</th>
              <th scope="col" class="px-4 py-3">Prioridad</th>
              <th scope="col" class="px-4 py-3">Estado</th>
              <th scope="col" class="px-4 py-3">Responsable</th>
              <th scope="col" class="px-4 py-3">Fecha</th>
              <th scope="col" class="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <td class="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-semibold text-primary-700">
                <NuxtLink :to="`/support/tickets/${ticket.id}`" class="hover:underline">
                  {{ ticket.radicado }}
                </NuxtLink>
              </td>
              <td class="px-4 py-3.5">
                <span class="inline-flex max-w-[10rem] truncate text-xs font-medium text-slate-900" :title="ticket.empresa?.nombre">
                  {{ ticket.empresa?.nombre || '—' }}
                </span>
              </td>
              <td class="px-4 py-3.5">
                <p class="max-w-xs truncate text-xs font-medium text-slate-900" :title="ticket.asunto">
                  {{ ticket.asunto }}
                </p>
                <p class="text-[11px] text-slate-500 truncate max-w-xs">
                  {{ ticket.modulo?.nombre || 'Módulo general' }}
                </p>
              </td>
              <td class="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">
                <span class="inline-flex items-center gap-1">
                  <UIcon name="i-heroicons-paper-airplane" class="h-3.5 w-3.5 text-slate-400" />
                  {{ ticket.canal_origen || 'Portal' }}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3.5">
                <UBadge
                  :color="getTicketPriorityPresentation(ticket.prioridad).color"
                  variant="subtle"
                  size="xs"
                >
                  {{ getTicketPriorityPresentation(ticket.prioridad).label }}
                </UBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-3.5">
                <UBadge
                  :color="getTicketStatusPresentation(ticket.estado).color"
                  variant="subtle"
                  size="xs"
                >
                  {{ getTicketStatusPresentation(ticket.estado).label }}
                </UBadge>
              </td>
              <td class="px-4 py-3.5 text-xs">
                <span
                  v-if="ticket.responsable"
                  class="font-medium text-slate-700"
                >
                  {{ ticket.responsable.nombre }}
                </span>
                <span
                  v-else
                  class="inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200/60"
                >
                  Sin asignar
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                {{ formatTicketDate(ticket.fecha_creacion) }}
              </td>
              <td class="whitespace-nowrap px-4 py-3.5 text-right">
                <UButton
                  :to="`/support/tickets/${ticket.id}`"
                  color="gray"
                  variant="outline"
                  size="xs"
                  icon="i-heroicons-arrow-top-right-on-square"
                >
                  Gestionar
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Card View (md:hidden) -->
    <div v-if="!isLoading && tickets.length > 0" class="space-y-3 md:hidden">
      <article
        v-for="ticket in tickets"
        :key="ticket.id"
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-mono text-xs font-semibold text-primary-700">
            {{ ticket.radicado }}
          </span>
          <UBadge
            :color="getTicketStatusPresentation(ticket.estado).color"
            variant="subtle"
            size="xs"
          >
            {{ getTicketStatusPresentation(ticket.estado).label }}
          </UBadge>
        </div>

        <div class="mt-2">
          <span class="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
            {{ ticket.empresa?.nombre }}
          </span>
          <h2 class="mt-1 text-sm font-semibold text-slate-900">
            {{ ticket.asunto }}
          </h2>
          <p class="text-xs text-slate-500">
            {{ ticket.modulo?.nombre }} · Canal: {{ ticket.canal_origen || 'Portal' }}
          </p>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
          <div>
            Prioridad:
            <UBadge
              :color="getTicketPriorityPresentation(ticket.prioridad).color"
              variant="subtle"
              size="xs"
              class="ml-1"
            >
              {{ getTicketPriorityPresentation(ticket.prioridad).label }}
            </UBadge>
          </div>
          <div>
            {{ formatTicketDate(ticket.fecha_creacion) }}
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span class="text-xs text-slate-600">
            <span class="font-medium">Responsable:</span>
            {{ ticket.responsable?.nombre || 'Sin asignar' }}
          </span>

          <UButton
            :to="`/support/tickets/${ticket.id}`"
            color="primary"
            variant="soft"
            size="xs"
          >
            Gestionar
          </UButton>
        </div>
      </article>
    </div>

    <!-- Pagination Footer -->
    <div
      v-if="!isLoading && totalTickets > 0"
      class="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:rounded-xl sm:border sm:px-6 sm:shadow-sm"
    >
      <div class="text-xs text-slate-600">
        Mostrando página <span class="font-medium text-slate-900">{{ currentPage }}</span> de
        <span class="font-medium text-slate-900">{{ totalPages }}</span>
        (<span class="font-medium text-slate-900">{{ totalTickets }}</span> tickets en total)
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="gray"
          variant="outline"
          size="xs"
          icon="i-heroicons-chevron-left"
          :disabled="!hasPreviousPage || isLoading"
          @click="selectPage(currentPage - 1)"
        >
          Anterior
        </UButton>
        <UButton
          color="gray"
          variant="outline"
          size="xs"
          trailing-icon="i-heroicons-chevron-right"
          :disabled="!hasNextPage || isLoading"
          @click="selectPage(currentPage + 1)"
        >
          Siguiente
        </UButton>
      </div>
    </div>
  </div>
</template>
