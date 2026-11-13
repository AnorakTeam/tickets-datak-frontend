<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import ModuleSelect from '~/components/tickets/ModuleSelect.vue'
import { ticketService, type TicketPriority, type CreateTicketPayload } from '~/services/ticketService'

useHead({
  title: 'Reportar Incidencia — Sistema de Tickets',
})

const router = useRouter()
const toast = useToast()

interface PriorityOption {
  value: TicketPriority
  label: string
  description: string
  color: 'gray' | 'blue' | 'amber' | 'red'
}

const priorityOptions: PriorityOption[] = [
  { value: 'Baja', label: 'Baja', description: 'No bloquea la operación diaria', color: 'gray' },
  { value: 'Media', label: 'Media', description: 'Afectación parcial de funcionalidades', color: 'blue' },
  { value: 'Alta', label: 'Alta', description: 'Bloqueo de una función importante', color: 'amber' },
  { value: 'Critica', label: 'Crítica', description: 'Bloqueo total del sistema o módulo', color: 'red' },
]

const form = reactive<{
  modulo_id: number | null
  pestana_o_documento: string
  asunto: string
  descripcion: string
  mensaje_error: string
  prioridad: TicketPriority
}>({
  modulo_id: null,
  pestana_o_documento: '',
  asunto: '',
  descripcion: '',
  mensaje_error: '',
  prioridad: 'Media',
})

const errors = reactive<Record<string, string>>({
  modulo_id: '',
  pestana_o_documento: '',
  asunto: '',
  descripcion: '',
  prioridad: '',
})

const isSubmitting = ref<boolean>(false)
const hasNoModules = ref<boolean>(false)

const handleModulesEmpty = (isEmpty: boolean) => {
  hasNoModules.value = isEmpty
}

const clearErrors = () => {
  errors.modulo_id = ''
  errors.pestana_o_documento = ''
  errors.asunto = ''
  errors.descripcion = ''
  errors.prioridad = ''
}

const validate = (): boolean => {
  clearErrors()
  let isValid = true

  if (!form.modulo_id) {
    errors.modulo_id = 'Debe seleccionar el módulo de software afectado.'
    isValid = false
  }

  const trimmedScreen = form.pestana_o_documento.trim()
  if (!trimmedScreen) {
    errors.pestana_o_documento = 'Indique la pantalla, vista o documento donde ocurrió el incidente.'
    isValid = false
  } else if (trimmedScreen.length > 255) {
    errors.pestana_o_documento = 'El nombre de pantalla no debe superar los 255 caracteres.'
    isValid = false
  }

  const trimmedSubject = form.asunto.trim()
  if (!trimmedSubject) {
    errors.asunto = 'El asunto o título del incidente es obligatorio.'
    isValid = false
  } else if (trimmedSubject.length > 255) {
    errors.asunto = 'El asunto no debe superar los 255 caracteres.'
    isValid = false
  }

  const trimmedDesc = form.descripcion.trim()
  if (!trimmedDesc) {
    errors.descripcion = 'La descripción detallada del problema es obligatoria.'
    isValid = false
  } else if (trimmedDesc.length < 15) {
    errors.descripcion = 'Por favor proporcione una descripción más detallada (mínimo 15 caracteres).'
    isValid = false
  }

  if (!form.prioridad) {
    errors.prioridad = 'Seleccione la prioridad estimada del incidente.'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (hasNoModules.value) {
    toast.add({
      title: 'Operación no permitida',
      description: 'Su empresa no tiene módulos contratados activos para radicar incidencias.',
      color: 'amber',
      icon: 'i-heroicons-exclamation-triangle',
    })
    return
  }

  if (!validate()) {
    toast.add({
      title: 'Formulario incompleto',
      description: 'Por favor complete todos los campos obligatorios antes de continuar.',
      color: 'red',
      icon: 'i-heroicons-exclamation-circle',
    })
    return
  }

  isSubmitting.value = true

  try {
    const payload: CreateTicketPayload = {
      modulo_id: form.modulo_id!,
      pestana_o_documento: form.pestana_o_documento.trim(),
      asunto: form.asunto.trim(),
      descripcion: form.descripcion.trim(),
      mensaje_error: form.mensaje_error.trim(),
      prioridad: form.prioridad,
    }

    const response = await ticketService.createTicket(payload)

    toast.add({
      title: '¡Incidencia radicada!',
      description: `Radicado generado exitosamente: ${response.radicado}`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    // Redirect to tickets list
    await router.push('/tickets')
  } catch (err: any) {
    toast.add({
      title: 'Error al radicar incidencia',
      description: err?.message || 'No fue posible registrar la incidencia en el servidor. Intente nuevamente.',
      color: 'red',
      icon: 'i-heroicons-x-circle',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header / Navigation Back -->
    <div class="flex items-center justify-between pb-2 border-b border-slate-200">
      <div>
        <NuxtLink
          to="/"
          class="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 mb-1"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5 mr-1" />
          Volver al Inicio
        </NuxtLink>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Reportar Nueva Incidencia
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Diligencie la información técnica para radicar un incidente con consecutivo oficial y notificación por correo.
        </p>
      </div>

      <UBadge color="primary" variant="subtle" size="sm" class="hidden sm:inline-flex">
        Portal del Cliente
      </UBadge>
    </div>

    <!-- Main Incident Form Card -->
    <UCard class="shadow-sm">
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Module and Priority Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Modulo Selector (FE-05 component) -->
          <ModuleSelect
            v-model="form.modulo_id"
            label="Módulo contratado afectado"
            placeholder="Seleccione el módulo donde ocurrió la falla..."
            :required="true"
            :error="errors.modulo_id"
            :disabled="isSubmitting"
            @empty="handleModulesEmpty"
          />

          <!-- Priority Dropdown -->
          <UFormGroup
            label="Nivel de prioridad estimado"
            :required="true"
            :error="errors.prioridad"
            help="Seleccione el nivel de urgencia o impacto en su operación."
          >
            <USelectMenu
              v-model="form.prioridad"
              :options="priorityOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Seleccione la prioridad..."
              :disabled="isSubmitting"
              size="md"
              class="w-full"
            >
              <template #option="{ option }">
                <div class="flex items-center justify-between w-full py-0.5">
                  <span class="font-medium text-slate-800">{{ option.label }}</span>
                  <span class="text-xs text-slate-500 ml-2">({{ option.description }})</span>
                </div>
              </template>
            </USelectMenu>
          </UFormGroup>
        </div>

        <!-- Screen / Document / Tab Input -->
        <UFormGroup
          label="Pantalla, ventana o documento afectado"
          :required="true"
          :error="errors.pestana_o_documento"
          help="Ejemplo: Facturación Electrónica / Factura F-203, Nómina > Liquidación Mensual."
        >
          <UInput
            v-model="form.pestana_o_documento"
            placeholder="Indique la pantalla o vista exacta donde se presentó el error"
            maxlength="255"
            size="md"
            icon="i-heroicons-window"
            :disabled="isSubmitting"
          />
        </UFormGroup>

        <!-- Subject Input -->
        <UFormGroup
          label="Asunto o resumen breve de la incidencia"
          :required="true"
          :error="errors.asunto"
          help="Resumen conciso y claro de la falla para el equipo de soporte."
        >
          <UInput
            v-model="form.asunto"
            placeholder="Ej: Error 500 al timbrar factura electrónica con retención en la fuente"
            maxlength="255"
            size="md"
            icon="i-heroicons-pencil-square"
            :disabled="isSubmitting"
          />
        </UFormGroup>

        <!-- Detailed Description Textarea -->
        <UFormGroup
          label="Descripción detallada del problema"
          :required="true"
          :error="errors.descripcion"
          help="Explique qué operación estaba realizando, qué datos ingresó y cuál fue el resultado inesperado."
        >
          <UTextarea
            v-model="form.descripcion"
            placeholder="Describa paso a paso cómo se presentó el problema..."
            :rows="5"
            :disabled="isSubmitting"
          />
        </UFormGroup>

        <!-- System Error Message Textarea (Optional) -->
        <UFormGroup
          label="Mensaje o código de error del sistema (Opcional)"
          help="Si el sistema arrojó un mensaje en pantalla, código o traza de error, péguelo aquí."
        >
          <UTextarea
            v-model="form.mensaje_error"
            placeholder="Ej: Internal Server Error: DatabaseConstraintException en línea 42..."
            :rows="3"
            class="font-mono text-xs"
            :disabled="isSubmitting"
          />
        </UFormGroup>

        <!-- Warning Alert if Company has no modules -->
        <UAlert
          v-if="hasNoModules"
          color="amber"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          title="Atención: No puede radicar incidencias"
          description="Su empresa no registra módulos de software contratados activos. Contacte a soporte o administración para habilitar el servicio."
        />

        <!-- Action Buttons -->
        <div class="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <UButton
            to="/"
            variant="ghost"
            color="gray"
            size="md"
            class="w-full sm:w-auto"
            :disabled="isSubmitting"
          >
            Cancelar
          </UButton>

          <UButton
            type="submit"
            color="primary"
            size="md"
            class="w-full sm:w-auto font-semibold shadow-sm"
            icon="i-heroicons-paper-airplane"
            :loading="isSubmitting"
            :disabled="isSubmitting || hasNoModules"
          >
            Radicar Incidencia
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
