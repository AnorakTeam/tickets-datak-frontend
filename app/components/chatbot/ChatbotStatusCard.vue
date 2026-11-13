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
        color: 'blue',
        icon: 'i-heroicons-inbox',
      }
    case 'en gestion':
    case 'en gestión':
      return {
        label: 'En Gestión',
        color: 'amber',
        icon: 'i-heroicons-arrow-path',
      }
    case 'resuelto':
      return {
        label: 'Resuelto',
        color: 'emerald',
        icon: 'i-heroicons-check-circle',
      }
    case 'no procedente':
      return {
        label: 'No Procedente',
        color: 'gray',
        icon: 'i-heroicons-no-symbol',
      }
    default:
      return {
        label: estado,
        color: 'blue',
        icon: 'i-heroicons-information-circle',
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
  <div class="mt-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2.5 text-slate-800" data-testid="chatbot-status-card">
    <!-- Header: Radicado and Status Badge -->
    <div class="flex items-center justify-between pb-1.5 border-b border-slate-200 gap-2">
      <div class="flex items-center space-x-1.5">
        <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-blue-600 shrink-0" />
        <span class="font-mono font-bold text-sm text-blue-700 tracking-wide" data-testid="status-radicado">
          {{ radicado }}
        </span>
      </div>

      <UBadge
        :color="statusConfig.color"
        variant="subtle"
        size="xs"
        class="font-semibold flex items-center space-x-1 shrink-0"
        data-testid="status-badge"
      >
        <UIcon :name="statusConfig.icon" class="w-3.5 h-3.5 mr-0.5" />
        <span>{{ statusConfig.label }}</span>
      </UBadge>
    </div>

    <!-- Ticket Summary Metadata -->
    <div class="space-y-1.5 text-xs">
      <div v-if="datos.asunto" class="flex justify-between items-start gap-2">
        <span class="text-slate-500 font-medium shrink-0">Asunto:</span>
        <span class="font-semibold text-slate-800 text-right truncate max-w-[200px]" data-testid="status-asunto">
          {{ datos.asunto }}
        </span>
      </div>

      <div v-if="datos.modulo" class="flex justify-between items-start gap-2">
        <span class="text-slate-500 font-medium shrink-0">Módulo:</span>
        <span class="text-slate-700 font-medium text-right" data-testid="status-modulo">
          {{ datos.modulo }}
        </span>
      </div>

      <div v-if="datos.fecha_creacion" class="flex justify-between items-start gap-2">
        <span class="text-slate-500 font-medium shrink-0">Fecha de radicado:</span>
        <span class="text-slate-600 text-right">
          {{ formatDate(datos.fecha_creacion) }}
        </span>
      </div>

      <!-- Solution Comment when Resolved -->
      <div
        v-if="datos.comentario_solucion"
        class="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900"
        data-testid="solution-comment"
      >
        <div class="flex items-center space-x-1 font-bold text-[11px] text-emerald-800 mb-0.5">
          <UIcon name="i-heroicons-light-bulb" class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Solución técnica oficial:</span>
        </div>
        <p class="text-xs text-emerald-800 leading-relaxed italic">
          {{ datos.comentario_solucion }}
        </p>
      </div>

      <!-- Motivo when Marked No Procedente -->
      <div
        v-if="datos.motivo_no_procedente"
        class="mt-2 p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
        data-testid="no-procedente-comment"
      >
        <div class="flex items-center space-x-1 font-bold text-[11px] text-slate-700 mb-0.5">
          <UIcon name="i-heroicons-information-circle" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Motivo de cierre:</span>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">
          {{ datos.motivo_no_procedente }}
        </p>
      </div>
    </div>

    <!-- Action Link to Client Ticket Detail -->
    <div class="pt-1.5 border-t border-slate-200 flex justify-end">
      <NuxtLink
        :to="`/tickets/${radicado}`"
        class="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        data-testid="view-ticket-detail-link"
      >
        <span>Ver detalle completo</span>
        <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
      </NuxtLink>
    </div>
  </div>
</template>
