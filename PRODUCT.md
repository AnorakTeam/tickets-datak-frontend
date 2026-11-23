# Product: Datak Tickets — Portal del Cliente y Mesa de Ayuda

## Overview
Datak Tickets es el sistema oficial de gestión de soporte e incidencias del ecosistema Datak ERP. Proporciona una interfaz web integrada para que los clientes corporativos radiquen y consulten el avance de sus requerimientos técnicos mediante un portal web o un asistente conversacional (chatbot), y permite al equipo interno de soporte de Datak triagiar, clasificar, asignar y resolver formalmente cada caso manteniendo trazabilidad absoluta.

## Users & Jobs

### 1. Cliente de Empresa (`cliente`)
* **Situación:** Usuario corporativo autenticado vinculado a una empresa cliente con módulos ERP contratados (p. ej. Acme Industrial, Global Logistics).
* **Trabajo a realizar:**
  * Reportar incidentes técnicos especificando el módulo contratado y la pantalla/documento afectado.
  * Consultar el estado de sus tickets radicados (`TK-AAAA-NNNNNN`) en tiempo real mediante listado web o diálogo con el chatbot.
  * Recibir notificaciones en la campana del portal ante resoluciones o respuestas de soporte.

### 2. Agente de Mesa de Ayuda (`agente_soporte`)
* **Situación:** Personal operativo interno de Datak encargado del primer nivel de atención.
* **Trabajo a realizar:**
  * Monitorear la bandeja de entrada unificada de tickets de todas las empresas clientes.
  * Registrar tickets externos recibidos por canales tradicionales (teléfono, correo, WhatsApp, presencial).
  * Clasificar la naturaleza del incidente (Bug, Error de uso, Solicitud de mejora), definir prioridad, asignar a ingenieros especializados o desestimar con causal justificada.

### 3. Ingeniero de Soporte / Desarrollador (`responsable_atencion`)
* **Situación:** Especialista técnico o desarrollador interno de Datak asignado a la solución del incidente.
* **Trabajo a realizar:**
  * Gestionar su cola personal de trabajo ("Mis Tickets Asignados").
  * Registrar notas internas de depuración, logs técnicos y análisis de causa raíz (estrictamente confidenciales e invisibles para el cliente).
  * Formalizar la resolución del caso documentando la solución aplicada y disparando las notificaciones correspondientes.

## Core Workflows

1. **Radicación de Incidentes vía Portal Web:**
   * El cliente accede a `/tickets/nuevo`.
   * El selector de módulos consulta reactivamente solo los módulos contratados y activos de su empresa.
   * Al enviar el formulario, el sistema genera el radicado secuencial `TK-AAAA-NNNNNN` y muestra confirmación modal inmediata.
2. **Consulta y Reporte vía Chatbot Asistente:**
   * Widget conversacional flotante disponible en todas las vistas de cliente.
   * Permite consultar el estado de un ticket mediante su radicado o iniciar un flujo guiado de 4 pasos para reportar un nuevo incidente con canal `Chatbot`.
3. **Triage y Clasificación en Mesa de Ayuda:**
   * El agente filtra la bandeja en `/support/tickets` por empresa, estado, prioridad o canal.
   * Clasifica el tipo de incidente, ajusta la severidad y asigna al ingeniero responsable (`dev@datak.co`), cambiando el estado a `En gestión`.
4. **Atención Técnica y Resolución Formal:**
   * El ingeniero abre el ticket desde `/support/mis-tickets`.
   * Agrega notas internas de investigación técnica.
   * Completa la resolución mediante formulario modal de cierre formal, pasando el estado a `Resuelto` y despachando notificación al cliente.

## Platform & Constraints

* **Plataforma:** Web Application responsive (Desktop / Tablet / Mobile).
* **Stack:** Nuxt 4, Vue 3, Nuxt UI 2/4, Pinia, TailwindCSS, TypeScript.
* **Multi-Tenancy Estricto (RNF2):** La empresa cliente nunca se envía en el cuerpo de peticiones del cliente; se infiere de la sesión JWT. Consultas cruzadas entre tenants retornan `404 Not Found`.
* **Confidencialidad de Auditoría (RNF3):** Las notas internas (`es_interna=True`) y la identidad del ingeniero responsable nunca se exponen al cliente.
* **Inmutabilidad de Auditoría (RNF5):** El historial de eventos (`TicketItem`) es estrictamente de adición (*append-only*); no permite modificaciones ni eliminaciones.
* **Idioma:** Código fuente 100% en inglés (variables, tipos, servicios, tests). Interfaz gráfica, etiquetas y mensajes 100% en español colombiano.

## Brand & Voice

* **Voz:** Precisa, profesional, sobria y orientada a la resolución ágil de tareas.
* **Estilo:** Estándar visual Datak ERP. Sin emojis decorativos en badges ni estados, con terminología de negocio clara y concisa.
