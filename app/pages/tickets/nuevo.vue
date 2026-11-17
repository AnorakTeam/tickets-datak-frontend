<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import ModuleSelect from '~/components/tickets/ModuleSelect.vue'
import RadicadoModal from '~/components/tickets/RadicadoModal.vue'
import { ticketService, type TicketPriority, type CreateTicketPayload } from '~/services/ticketService'

definePageMeta({
  middleware: 'auth',
})

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
const moduleLoadError = ref<string | null>(null)
const isModalOpen = ref<boolean>(false)

const createdTicket = reactive<{
  radicado: string
  asunto: string
  moduloNombre: string
  mensaje: string
}>({
  radicado: '',
  asunto: '',
  moduloNombre: '',
  mensaje: '',
})

const resetForm = () => {
  form.modulo_id = null
  form.pestana_o_documento = ''
  form.asunto = ''
  form.descripcion = ''
  form.mensaje_error = ''
  form.prioridad = 'Media'
  errors.modulo_id = ''
  errors.pestana_o_documento = ''
  errors.asunto = ''
  errors.descripcion = ''
  errors.prioridad = ''
}

const handleModalClose = async () => {
  isModalOpen.value = false
  await router.push('/tickets')
}

// Separate state handlers for ModuleSelect
const handleModulesEmpty = (isEmpty: boolean) => {
  hasNoModules.value = isEmpty
  if (isEmpty) {
    moduleLoadError.value = null
  }
}

const handleModulesError = (error: string | null) => {
  moduleLoadError.value = error
  if (error) {
    hasNoModules.value = false
  }
}

const handleModulesLoaded = () => {
  moduleLoadError.value = null
}

// Field-specific validation functions (real-time validation)
const validateModulo = (showError = false): boolean => {
  if (!form.modulo_id) {
    if (showError) errors.modulo_id = 'Debe seleccionar el módulo de software afectado.'
    return false
  }
  errors.modulo_id = ''
  return true
}

const validatePrioridad = (showError = false): boolean => {
  if (!form.prioridad) {
    if (showError) errors.prioridad = 'Seleccione la prioridad estimada del incidente.'
    return false
  }
  errors.prioridad = ''
  return true
}

const validatePestana = (showError = false): boolean => {
  const trimmed = form.pestana_o_documento.trim()
  if (!trimmed) {
    if (showError) errors.pestana_o_documento = 'Indique la pantalla, vista o documento donde ocurrió el incidente.'
    return false
  }
  if (trimmed.length > 255) {
    errors.pestana_o_documento = 'El nombre de pantalla no debe superar los 255 caracteres.'
    return false
  }
  errors.pestana_o_documento = ''
  return true
}

const validateAsunto = (showError = false): boolean => {
  const trimmed = form.asunto.trim()
  if (!trimmed) {
    if (showError) errors.asunto = 'El asunto o título del incidente es obligatorio.'
    return false
  }
  if (trimmed.length > 255) {
    errors.asunto = 'El asunto no debe superar los 255 caracteres.'
    return false
  }
  errors.asunto = ''
  return true
}

const validateDescripcion = (showError = false): boolean => {
  const trimmed = form.descripcion.trim()
  if (!trimmed) {
    if (showError) errors.descripcion = 'La descripción detallada del problema es obligatoria.'
    return false
  }
  if (trimmed.length < 15) {
    if (showError) errors.descripcion = 'Por favor proporcione una descripción más detallada (mínimo 15 caracteres).'
    return false
  }
  errors.descripcion = ''
  return true
}

// Immediate error clearing / real-time revalidation when user edits fields
watch(() => form.modulo_id, (val) => {
  if (val) {
    errors.modulo_id = ''
  }
})

watch(() => form.prioridad, (val) => {
  if (val) {
    errors.prioridad = ''
  }
})

watch(() => form.pestana_o_documento, () => {
  if (errors.pestana_o_documento) {
    validatePestana(true)
  }
})

watch(() => form.asunto, () => {
  if (errors.asunto) {
    validateAsunto(true)
  }
})

watch(() => form.descripcion, () => {
  if (errors.descripcion) {
    validateDescripcion(true)
  }
})

const validate = (): boolean => {
  const isModValid = validateModulo(true)
  const isPrioValid = validatePrioridad(true)
  const isPestValid = validatePestana(true)
  const isAsuValid = validateAsunto(true)
  const isDescValid = validateDescripcion(true)

  return isModValid && isPrioValid && isPestValid && isAsuValid && isDescValid
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

    createdTicket.radicado = response.radicado
    createdTicket.asunto = response.asunto || payload.asunto
    createdTicket.moduloNombre = response.modulo?.nombre || ''
    createdTicket.mensaje = response.mensaje || 'Incidencia radicada exitosamente. Se ha enviado un comprobante a su correo.'
    isModalOpen.value = true

    toast.add({
      title: '¡Incidencia radicada!',
      description: `Radicado generado exitosamente: ${response.radicado}`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No fue posible registrar la incidencia en el servidor. Intente nuevamente.'
    toast.add({
      title: 'Error al radicar incidencia',
      description: message,
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
            @error="handleModulesError"
            @loaded="handleModulesLoaded"
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

        <!-- Connection Error Banner if Module Fetch Failed -->
        <UAlert
          v-if="moduleLoadError"
          color="red"
          variant="soft"
          icon="i-heroicons-exclamation-circle"
          title="Fallo de conexión con el catálogo de módulos"
          :description="`No se pudieron cargar los módulos contratados (${moduleLoadError}). Puede reintentar desde el botón del selector o verificar su conexión.`"
        />

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
            @blur="validatePestana(true)"
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
            @blur="validateAsunto(true)"
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
            @blur="validateDescripcion(true)"
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

        <!-- Warning Alert ONLY if Company genuinely has no modules -->
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

    <!-- Confirmation Modal with Radicado & One-Click Copy (FE-07) -->
    <RadicadoModal
      v-model="isModalOpen"
      :radicado="createdTicket.radicado"
      :asunto="createdTicket.asunto"
      :modulo-nombre="createdTicket.moduloNombre"
      :mensaje="createdTicket.mensaje"
      @close="handleModalClose"
    />
  </div>
</template>
