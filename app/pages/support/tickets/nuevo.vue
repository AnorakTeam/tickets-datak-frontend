<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import RadicadoModal from '~/components/tickets/RadicadoModal.vue'
import {
  supportTicketService,
  type CompanyModule,
  type CreateExternalTicketPayload,
  type SupportEmpresa,
} from '~/services/supportTicketService'
import type { TicketPriority } from '~/services/ticketService'

definePageMeta({
  middleware: 'support',
})

useHead({
  title: 'Registrar Ticket Externo — Consola de Soporte',
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
  { value: 'Media', label: 'Media', description: 'Afectación parcial de funciones', color: 'blue' },
  { value: 'Alta', label: 'Alta', description: 'Bloqueo de una función importante', color: 'amber' },
  { value: 'Critica', label: 'Crítica', description: 'Bloqueo total del sistema', color: 'red' },
]

const channelOptions = [
  { value: 'WhatsApp', label: 'WhatsApp', icon: 'i-lucide-message-circle' },
  { value: 'Slack', label: 'Slack', icon: 'i-lucide-hash' },
  { value: 'Correo', label: 'Correo electrónico', icon: 'i-lucide-mail' },
  { value: 'Llamada', label: 'Llamada telefónica', icon: 'i-lucide-phone' },
  { value: 'Otro', label: 'Otro canal externo', icon: 'i-lucide-more-horizontal' },
]

const form = reactive<{
  empresa_id: number | null
  modulo_id: number | null
  canal_origen: string
  pestana_o_documento: string
  asunto: string
  descripcion: string
  mensaje_error: string
  prioridad: TicketPriority
}>({
  empresa_id: null,
  modulo_id: null,
  canal_origen: 'WhatsApp',
  pestana_o_documento: '',
  asunto: '',
  descripcion: '',
  mensaje_error: '',
  prioridad: 'Media',
})

const errors = reactive<Record<string, string>>({
  empresa_id: '',
  modulo_id: '',
  canal_origen: '',
  pestana_o_documento: '',
  asunto: '',
  descripcion: '',
  prioridad: '',
})

const empresas = ref<SupportEmpresa[]>([])
const availableModules = ref<CompanyModule[]>([])
const isLoadingEmpresas = ref(false)
const isSubmitting = ref(false)
const isModalOpen = ref(false)

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

const clearErrors = () => {
  errors.empresa_id = ''
  errors.modulo_id = ''
  errors.canal_origen = ''
  errors.pestana_o_documento = ''
  errors.asunto = ''
  errors.descripcion = ''
  errors.prioridad = ''
}

const loadEmpresas = async () => {
  isLoadingEmpresas.value = true
  try {
    empresas.value = await supportTicketService.getSupportEmpresas()
  } catch {
    toast.add({
      title: 'Error al cargar empresas',
      description: 'No fue posible obtener el catálogo de empresas clientes.',
      color: 'red',
      icon: 'i-lucide-x-circle',
    })
  } finally {
    isLoadingEmpresas.value = false
  }
}

watch(
  () => form.empresa_id,
  (empresaId) => {
    form.modulo_id = null

    const empresa = empresas.value.find(
      (item) => item.id === empresaId,
    )

    availableModules.value =
      empresa?.modulos_contratados ?? empresa?.modulos ?? []
  },
)

const validate = (): boolean => {
  clearErrors()
  let isValid = true

  if (!form.empresa_id) {
    errors.empresa_id = 'Debe seleccionar la empresa cliente que reporta el incidente.'
    isValid = false
  }

  if (!form.modulo_id) {
    errors.modulo_id = 'Debe seleccionar el módulo de software afectado.'
    isValid = false
  }

  if (!form.canal_origen) {
    errors.canal_origen = 'Seleccione el canal externo de origen.'
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
  if (!validate()) {
    toast.add({
      title: 'Formulario incompleto',
      description: 'Por favor complete todos los campos obligatorios antes de registrar el ticket.',
      color: 'red',
      icon: 'i-lucide-alert-circle',
    })
    return
  }

  isSubmitting.value = true

  try {
    const payload: CreateExternalTicketPayload = {
      empresa_id: form.empresa_id!,
      modulo_id: form.modulo_id!,
      canal_origen: form.canal_origen,
      pestana_o_documento: form.pestana_o_documento.trim(),
      asunto: form.asunto.trim(),
      descripcion: form.descripcion.trim(),
      mensaje_error: form.mensaje_error.trim(),
      prioridad: form.prioridad,
    }

    const response = await supportTicketService.createExternalTicket(payload)

    const selectedMod = availableModules.value.find((m) => m.id === form.modulo_id)
    createdTicket.radicado = response.radicado
    createdTicket.asunto = response.asunto || payload.asunto
    createdTicket.moduloNombre = response.modulo?.nombre || selectedMod?.nombre || ''
    createdTicket.mensaje =
      response.mensaje ||
      `Ticket externo registrado correctamente vía ${form.canal_origen} en nombre del cliente.`
    isModalOpen.value = true

    toast.add({
      title: '¡Ticket externo registrado!',
      description: `Radicado generado: ${response.radicado}`,
      color: 'green',
      icon: 'i-lucide-check-circle',
    })
  } catch (err: any) {
    toast.add({
      title: 'Error al registrar ticket',
      description:
        err?.message || 'No fue posible registrar el ticket en el servidor. Intente nuevamente.',
      color: 'red',
      icon: 'i-lucide-x-circle',
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleModalClose = async () => {
  isModalOpen.value = false
  await router.push('/support/tickets')
}

onMounted(() => {
  void loadEmpresas()
})
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header / Navigation Back -->
    <div>
      <NuxtLink
        to="/support/tickets"
        class="inline-flex items-center text-xs font-medium text-muted hover:text-highlighted transition-colors mb-2"
      >
        <UIcon name="i-lucide-arrow-left" class="mr-1.5 h-3.5 w-3.5" />
        Volver a la bandeja de soporte
      </NuxtLink>
      <h1 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
        Registrar ticket por canal externo
      </h1>
      <p class="mt-1 text-sm text-muted">
        Radicación formal de incidencias recibidas por WhatsApp, Slack, llamadas o correos en nombre del cliente.
      </p>
    </div>

    <!-- Main Form Card -->
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <div class="rounded-xl border border-default bg-default p-6 shadow-sm space-y-5">
        <!-- 1. Empresa Cliente & Canal de Origen -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <!-- Empresa Selection -->
          <UFormGroup
            label="Empresa cliente"
            required
            :error="errors.empresa_id"
            help="Seleccione la empresa para la cual se radicará el ticket"
          >
            <select
              v-model="form.empresa_id"
              class="w-full rounded-lg border border-default bg-default px-3 py-2 text-sm text-default focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              :disabled="isLoadingEmpresas || isSubmitting"
              aria-label="Seleccionar empresa cliente"
            >
              <option :value="null" disabled>
                {{ isLoadingEmpresas ? 'Cargando empresas...' : 'Seleccione una empresa cliente...' }}
              </option>
              <option
                v-for="emp in empresas"
                :key="emp.id"
                :value="emp.id"
              >
                {{ emp.nombre }}
              </option>
            </select>
          </UFormGroup>

          <!-- Canal de Origen -->
          <UFormGroup
            label="Canal de origen"
            required
            :error="errors.canal_origen"
            help="Medio por el cual el cliente reportó la incidencia"
          >
            <select
              v-model="form.canal_origen"
              class="w-full rounded-lg border border-default bg-default px-3 py-2 text-sm text-default focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              :disabled="isSubmitting"
              aria-label="Seleccionar canal de origen"
            >
              <option
                v-for="ch in channelOptions"
                :key="ch.value"
                :value="ch.value"
              >
                {{ ch.label }}
              </option>
            </select>
          </UFormGroup>
        </div>

        <!-- 2. Módulo Afectado Dinámico -->
        <div>
          <UFormGroup
            label="Módulo de software afectado"
            required
            :error="errors.modulo_id"
            help="Módulos contratados activos de la empresa cliente"
          >
            <div v-if="!form.empresa_id" class="rounded-lg border border-dashed border-default bg-muted p-4 text-center text-xs text-muted">
              <UIcon name="i-lucide-building-2" class="mx-auto h-5 w-5 text-dimmed mb-1" />
              Seleccione primero una empresa cliente para cargar sus módulos contratados.
            </div>

            <div
              v-else-if="availableModules.length === 0"
              class="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200 flex items-center gap-2"
            >
              <UIcon name="i-lucide-alert-triangle" class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Esta empresa no tiene módulos contratados activos registrados.</span>
            </div>

            <select
              v-else
              v-model="form.modulo_id"
              class="w-full rounded-lg border border-default bg-default px-3 py-2 text-sm text-default focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              :disabled="isSubmitting"
              aria-label="Seleccionar módulo afectado"
            >
              <option :value="null" disabled>Seleccione el módulo afectado...</option>
              <option
                v-for="mod in availableModules"
                :key="mod.id"
                :value="mod.id"
              >
                {{ mod.nombre }} {{ mod.codigo ? `(${mod.codigo})` : '' }}
              </option>
            </select>
          </UFormGroup>
        </div>

        <!-- 3. Pantalla / Documento Afectado -->
        <UFormGroup
          label="Pantalla, documento o vista donde ocurre"
          required
          :error="errors.pestana_o_documento"
          help="Ej: Factura de venta, Comprobante de egreso, Reporte de nómina..."
        >
          <UInput
            v-model="form.pestana_o_documento"
            placeholder="Ej: Factura electrónica, Recibo de caja, Reporte de nómina..."
            :disabled="isSubmitting"
            maxlength="255"
          />
        </UFormGroup>

        <!-- 4. Asunto / Título -->
        <UFormGroup
          label="Asunto del incidente"
          required
          :error="errors.asunto"
          help="Resumen claro y conciso del problema reportado por el cliente"
        >
          <UInput
            v-model="form.asunto"
            placeholder="Ej: Error al calcular retención en la fuente al guardar factura"
            :disabled="isSubmitting"
            maxlength="255"
          />
        </UFormGroup>

        <!-- 5. Descripción Detallada -->
        <UFormGroup
          label="Descripción detallada del incidente"
          required
          :error="errors.descripcion"
          help="Transcriba el detalle del problema, pasos para reproducirlo y afectación reportada (mínimo 15 caracteres)"
        >
          <UTextarea
            v-model="form.descripcion"
            :rows="4"
            placeholder="Describa el comportamiento reportado por el cliente con el mayor detalle posible..."
            :disabled="isSubmitting"
          />
        </UFormGroup>

        <!-- 6. Mensaje o Código de Error (Opcional) -->
        <UFormGroup
          label="Mensaje o código de error técnico (opcional)"
          help="Texto exacto del error arrojado por el sistema o suministrado por el cliente"
        >
          <UInput
            v-model="form.mensaje_error"
            placeholder="Ej: HTTP 500 Internal Server Error, ORA-01403, Validación fallida..."
            :disabled="isSubmitting"
          />
        </UFormGroup>

        <!-- 7. Prioridad Estimada -->
        <div class="space-y-3">
          <label class="block text-xs font-semibold uppercase tracking-wider text-muted">
            Prioridad asignada <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <label
              v-for="p in priorityOptions"
              :key="p.value"
              class="relative flex cursor-pointer flex-col rounded-lg border p-3 text-left transition-all"
              :class="form.prioridad === p.value
                ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                : 'border-default bg-default hover:bg-muted/60'"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-highlighted">{{ p.label }}</span>
                <input
                  v-model="form.prioridad"
                  type="radio"
                  name="priority"
                  :value="p.value"
                  class="h-3.5 w-3.5 text-primary-600 border-default focus:ring-primary-500"
                  :disabled="isSubmitting"
                />
              </div>
              <p class="mt-1 text-[11px] text-muted leading-tight">
                {{ p.description }}
              </p>
            </label>
          </div>
          <p v-if="errors.prioridad" class="text-xs text-red-500 dark:text-red-400">
            {{ errors.prioridad }}
          </p>
        </div>
      </div>

      <!-- Action Buttons (Single Signal Rule: one solid primary) -->
      <div class="flex items-center justify-end gap-3">
        <UButton
          to="/support/tickets"
          color="gray"
          variant="outline"
          :disabled="isSubmitting"
        >
          Cancelar
        </UButton>
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          :loading="isSubmitting"
        >
          Registrar ticket externo
        </UButton>
      </div>
    </form>

    <!-- Modal de confirmación de radicado exitoso -->
    <RadicadoModal
      v-model="isModalOpen"
      :radicado="createdTicket.radicado"
      :asunto="createdTicket.asunto"
      :modulo="createdTicket.moduloNombre"
      :mensaje="createdTicket.mensaje"
      @close="handleModalClose"
    />
  </div>
</template>
