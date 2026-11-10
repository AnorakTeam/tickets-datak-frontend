<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

useHead({
  title: 'Inicio — Sistema de Tickets',
})
</script>

<template>
  <div class="space-y-8">
    <!-- Hero Greeting -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-md">
      <div class="max-w-3xl">
        <UBadge color="white" variant="solid" size="xs" class="mb-3 text-blue-700 font-semibold">
          Portal de Atención al Cliente
        </UBadge>
        <h1 class="text-3xl font-extrabold sm:text-4xl tracking-tight">
          Bienvenido al Sistema de Gestión de Tickets
        </h1>
        <p class="mt-3 text-blue-100 text-base sm:text-lg leading-relaxed">
          Reporta problemas o fallas técnicas en tus módulos contratados con radicado único, 
          haz seguimiento en tiempo real y recibe atención oportuna con total trazabilidad.
        </p>

        <div class="mt-6 flex flex-wrap gap-3">
          <UButton
            to="/tickets/nuevo"
            size="lg"
            color="white"
            variant="solid"
            class="text-blue-700 font-semibold shadow-sm hover:bg-blue-50"
            icon="i-heroicons-plus-circle"
          >
            Reportar Nueva Incidencia
          </UButton>
          <UButton
            to="/tickets"
            size="lg"
            variant="outline"
            class="text-white border-white/50 hover:bg-white/10"
            icon="i-heroicons-queue-list"
          >
            Consultar Mis Tickets
          </UButton>
        </div>
      </div>
    </div>

    <!-- Quick Features Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard>
        <template #header>
          <div class="flex items-center space-x-3">
            <div class="p-2 rounded-lg bg-blue-50 text-blue-600">
              <UIcon name="i-heroicons-document-text" class="w-6 h-6" />
            </div>
            <h3 class="font-bold text-slate-900">Reporte Guiado</h3>
          </div>
        </template>
        <p class="text-sm text-slate-600">
          Diligencia el formulario indicando el módulo afectado, pantalla y mensaje de error para generar un número de radicado oficial.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center space-x-3">
            <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <UIcon name="i-heroicons-chat-bubble-left-right" class="w-6 h-6" />
            </div>
            <h3 class="font-bold text-slate-900">Asistente Chatbot</h3>
          </div>
        </template>
        <p class="text-sm text-slate-600">
          Describe tu incidencia de manera natural con el asistente conversacional o consulta el estado actual de tu radicado en segundos.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center space-x-3">
            <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <UIcon name="i-heroicons-shield-check" class="w-6 h-6" />
            </div>
            <h3 class="font-bold text-slate-900">Aislamiento Seguro</h3>
          </div>
        </template>
        <p class="text-sm text-slate-600">
          Acceso estrictamente restringido a los módulos y tickets de tu empresa, garantizando total confidencialidad e integridad.
        </p>
      </UCard>
    </div>
  </div>
</template>
