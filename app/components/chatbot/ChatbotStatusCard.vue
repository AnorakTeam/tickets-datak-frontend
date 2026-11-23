<script setup lang="ts">
import { computed } from 'vue'

export interface TicketStatusData {
  estado?: string
  asunto?: string
  modulo?: string
  fecha_creacion?: string
  comentario_solucion?: string
  motivo_no_procedente?: string
}

interface Props {
  radicado: string
  datos?: TicketStatusData
  mensaje?: string
}

const props = withDefaults(defineProps<Props>(), {
  datos: () => ({}),
  mensaje: '',
})

type BadgeColor = 'blue' | 'amber' | 'emerald' | 'gray' | 'red'

const statusConfig = computed<{
  label: string
  color: BadgeColor
  icon: string
}>(() => {
  const estado = props.datos?.estado || 'Abierto'
  switch (estado.toLowerCase()) {
    case 'abierto':
      return {
        label: 'Abierto',
        color: 'amber',
        icon: 'i-lucide-clock',
      }
    case 'en gestion':
    case 'en gestión':
      return {
        label: 'En Gestión',
        color: 'amber',
        icon: 'i-lucide-hourglass',
      }
    case 'resuelto':
      return {
        label: 'Resuelto',
        color: 'emerald',
        icon: 'i-lucide-check-circle-2',
      }
    case 'no procedente':
      return {
        label: 'No Procedente',
        color: 'gray',
        icon: 'i-lucide-ban',
      }
    default:
      return {
        label: estado,
        color: 'gray',
        icon: 'i-lucide-help-circle',
      }
  }
})

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="mt-2.5 bg-default border border-default rounded-xl p-3 text-xs space-y-2.5 text-default shadow-xs" data-testid="chatbot-status-card">
    <!-- Header: Radicado and Status Badge -->
    <div class="flex items-center justify-between pb-1.5 border-b border-default gap-2">
      <div class="flex items-center space-x-1.5">
        <UIcon name="i-lucide-search" class="w-4 h-4 text-muted shrink-0" />
        <span class="font-mono font-bold text-sm tabular-nums text-highlighted tracking-wide" data-testid="status-radicado">
          {{ radicado }}
        </span>
      </div>

      <UBadge
        :color="statusConfig.color"
        variant="subtle"
        size="xs"
        class="font-medium flex items-center space-x-1 shrink-0 rounded-md text-xs"
        data-testid="status-badge"
      >
        <UIcon :name="statusConfig.icon" class="w-3.5 h-3.5 mr-0.5" />
        <span>{{ statusConfig.label }}</span>
      </UBadge>
    </div>

    <!-- Ticket Summary Metadata -->
    <div class="space-y-1.5 text-xs">
      <div v-if="datos.asunto" class="flex justify-between items-start gap-2">
        <span class="text-muted font-medium shrink-0">Asunto:</span>
        <span class="font-semibold text-highlighted text-right truncate max-w-[200px]" data-testid="status-asunto">
          {{ datos.asunto }}
        </span>
      </div>

      <div v-if="datos.modulo" class="flex justify-between items-start gap-2">
        <span class="text-muted font-medium shrink-0">Módulo:</span>
        <span class="text-default font-medium text-right" data-testid="status-modulo">
          {{ datos.modulo }}
        </span>
      </div>

      <div v-if="datos.fecha_creacion" class="flex justify-between items-start gap-2">
        <span class="text-muted font-medium shrink-0">Fecha de radicado:</span>
        <span class="text-default text-right tabular-nums">
          {{ formatDate(datos.fecha_creacion) }}
        </span>
      </div>

      <!-- Solution Comment when Resolved -->
      <div
        v-if="datos.comentario_solucion"
        class="mt-2 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
        data-testid="solution-comment"
      >
        <div class="flex items-center space-x-1 font-semibold text-[11px] text-emerald-800 dark:text-emerald-300 mb-0.5">
          <UIcon name="i-lucide-check-circle-2" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Solución técnica oficial:</span>
        </div>
        <p class="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed italic">
          {{ datos.comentario_solucion }}
        </p>
      </div>

      <!-- Motivo when Marked No Procedente -->
      <div
        v-if="datos.motivo_no_procedente"
        class="mt-2 p-2.5 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200"
        data-testid="no-procedente-comment"
      >
        <div class="flex items-center space-x-1 font-semibold text-[11px] text-red-800 dark:text-red-300 mb-0.5">
          <UIcon name="i-lucide-ban" class="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
          <span>Motivo de cierre:</span>
        </div>
        <p class="text-xs text-red-900 dark:text-red-200 leading-relaxed">
          {{ datos.motivo_no_procedente }}
        </p>
      </div>
    </div>

    <!-- Action Link to Client Ticket Detail -->
    <div class="pt-1.5 border-t border-default flex justify-end">
      <NuxtLink
        :to="`/tickets/${radicado}`"
        class="inline-flex items-center space-x-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
        data-testid="view-ticket-detail-link"
      >
        <span>Ver detalle completo</span>
        <UIcon name="i-lucide-arrow-up-right" class="w-3.5 h-3.5" />
      </NuxtLink>
    </div>
  </div>
</template>
