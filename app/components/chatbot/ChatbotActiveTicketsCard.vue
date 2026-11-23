<script setup lang="ts">
export interface ActiveTicketSummary {
  radicado: string
  asunto?: string
  modulo?: string
  estado?: string
  prioridad?: string
  comentario_solucion?: string
}

interface Props {
  tickets?: ActiveTicketSummary[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tickets: () => [],
  disabled: false,
})

const emit = defineEmits<{
  (e: 'select', radicado: string): void
}>()

const getStatusColor = (estado?: string): 'amber' | 'emerald' | 'gray' | 'red' => {
  if (!estado) return 'gray'
  const lower = estado.toLowerCase()
  if (lower.includes('gestión') || lower.includes('gestion') || lower.includes('abierto')) {
    return 'amber'
  }
  if (lower.includes('resuelto')) {
    return 'emerald'
  }
  if (lower.includes('no procedente')) {
    return 'gray'
  }
  return 'gray'
}
</script>

<template>
  <div
    class="mt-2.5 bg-default border border-default rounded-xl p-3 text-xs space-y-2.5 text-default shadow-xs"
    data-testid="chatbot-active-tickets-card"
  >
    <!-- Header: Count and Title -->
    <div class="flex items-center justify-between border-b border-default pb-2">
      <div class="flex items-center space-x-1.5 font-semibold text-highlighted">
        <UIcon name="i-lucide-inbox" class="w-4 h-4 text-primary-500 shrink-0" />
        <span>Tickets Activos</span>
      </div>
      <UBadge
        size="xs"
        color="primary"
        variant="subtle"
        class="rounded-md font-medium tabular-nums"
      >
        {{ tickets.length }} {{ tickets.length === 1 ? 'ticket' : 'tickets' }}
      </UBadge>
    </div>

    <p class="text-xs text-muted">
      Selecciona un ticket para consultar su trazabilidad o avance:
    </p>

    <!-- Tickets List -->
    <div class="space-y-2">
      <div
        v-for="ticket in tickets"
        :key="ticket.radicado"
        class="p-2.5 rounded-lg border border-default bg-muted/50 hover:bg-default hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer group space-y-1.5"
        data-testid="active-ticket-item"
        @click="emit('select', ticket.radicado)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-mono font-bold text-primary-600 dark:text-primary-400 tabular-nums text-xs group-hover:underline">
            {{ ticket.radicado }}
          </span>
          <UBadge
            size="xs"
            :color="getStatusColor(ticket.estado)"
            variant="subtle"
            class="rounded-md shrink-0"
          >
            {{ ticket.estado || 'Activo' }}
          </UBadge>
        </div>

        <div v-if="ticket.asunto" class="font-medium text-highlighted text-xs line-clamp-1">
          {{ ticket.asunto }}
        </div>

        <div class="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-default/60">
          <span v-if="ticket.modulo" class="truncate max-w-[180px]">
            {{ ticket.modulo }}
          </span>
          <span v-else class="truncate">
            Incidencia en soporte
          </span>

          <span class="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium group-hover:translate-x-0.5 transition-transform">
            <span>Consultar</span>
            <UIcon name="i-lucide-arrow-right" class="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>

    <!-- Quick select chips (for instant 1-tap query) -->
    <div v-if="tickets.length > 1" class="pt-1.5 border-t border-default flex flex-wrap items-center gap-1.5">
      <span class="text-[11px] text-muted font-medium mr-1">Opciones rápidas:</span>
      <button
        v-for="t in tickets"
        :key="t.radicado"
        type="button"
        class="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-muted hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 dark:hover:bg-primary-950/40 dark:hover:text-primary-300 border border-default text-highlighted transition-all inline-flex items-center gap-1 active:scale-95"
        :disabled="disabled"
        :data-testid="`chip-select-ticket-${t.radicado}`"
        @click.stop="emit('select', t.radicado)"
      >
        <UIcon name="i-lucide-search" class="w-3 h-3 text-primary-500" />
        <span>{{ t.radicado }}</span>
      </button>
    </div>
  </div>
</template>
