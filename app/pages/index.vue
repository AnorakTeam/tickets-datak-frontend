<script setup lang="ts">
useHead({
  title: 'Inicio — Tickets Datak',
})
</script>

<template>
  <div class="space-y-6">
    <!-- Hero Greeting Card -->
    <div class="relative overflow-hidden rounded-xl border border-default bg-default p-6 shadow-sm sm:p-8">
      <div class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600" />
      <div class="max-w-3xl">
        <UBadge color="gray" variant="subtle" size="xs" class="font-medium">
          Portal de Atención al Cliente
        </UBadge>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
          Bienvenido al Sistema de Gestión de Tickets
        </h1>
        <p class="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted">
          Reporta problemas o incidencias técnicas en tus módulos contratados con radicado único,
          haz seguimiento en tiempo real y recibe atención oportuna con total trazabilidad.
        </p>

        <div class="mt-6 flex flex-wrap gap-3">
          <UButton
            to="/tickets/nuevo"
            size="md"
            color="primary"
            variant="solid"
            icon="i-lucide-circle-plus"
            class="transition-colors duration-150 ease-out"
          >
            Reportar nueva incidencia
          </UButton>
          <UButton
            to="/tickets"
            size="md"
            color="gray"
            variant="outline"
            icon="i-lucide-list"
            class="transition-colors duration-150 ease-out"
          >
            Consultar mis tickets
          </UButton>
        </div>
      </div>
    </div>

    <!-- Quick Features Overview -->
    <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
      <div class="rounded-xl border border-default bg-default p-5 shadow-xs transition-colors duration-150 hover:bg-muted/40">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-default">
            <UIcon name="i-lucide-file-text" class="h-4.5 w-4.5 text-muted" />
          </div>
          <h2 class="text-sm font-semibold text-highlighted">Reporte guiado</h2>
        </div>
        <p class="mt-3 text-xs leading-relaxed text-muted">
          Diligencia el formulario indicando el módulo contratado, pantalla y mensaje de error para generar un número de radicado oficial secuencial.
        </p>
      </div>

      <div class="rounded-xl border border-default bg-default p-5 shadow-xs transition-colors duration-150 hover:bg-muted/40">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-default">
            <UIcon name="i-lucide-messages-square" class="h-4.5 w-4.5 text-muted" />
          </div>
          <h2 class="text-sm font-semibold text-highlighted">Asistente Datak</h2>
        </div>
        <p class="mt-3 text-xs leading-relaxed text-muted">
          Describe tu incidencia de manera natural con el asistente conversacional o consulta el estado actual de tu radicado en cualquier momento.
        </p>
      </div>

      <div class="rounded-xl border border-default bg-default p-5 shadow-xs transition-colors duration-150 hover:bg-muted/40">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-default">
            <UIcon name="i-lucide-shield-check" class="h-4.5 w-4.5 text-muted" />
          </div>
          <h2 class="text-sm font-semibold text-highlighted">Aislamiento seguro</h2>
        </div>
        <p class="mt-3 text-xs leading-relaxed text-muted">
          Acceso estrictamente restringido a los módulos y tickets de tu empresa con confidencialidad absoluta en auditoría interna.
        </p>
      </div>
    </div>
  </div>
</template>
