# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

### 1. Cliente de Empresa (`cliente`)
* **Situación:** Usuario corporativo autenticado vinculado a una empresa cliente con módulos ERP contratados (p. ej. Acme Industrial, Global Logistics).
* **Trabajo a realizar:**
  * Reportar incidentes técnicos especificando el módulo contratado y la pantalla o documento afectado.
  * Consultar el estado de sus tickets radicados (`TK-AAAA-NNNNNN`) en tiempo real mediante listado web o diálogo con el chatbot asistente.
  * Recibir notificaciones en la campana del portal ante resoluciones o actualizaciones del equipo de soporte.

### 2. Agente de Mesa de Ayuda (`agente_soporte`)
* **Situación:** Personal operativo interno de Datak encargado del primer nivel de atención y triaje de incidencias.
* **Trabajo a realizar:**
  * Monitorear la bandeja de entrada unificada de tickets de todas las empresas clientes.
  * Registrar tickets externos recibidos por canales tradicionales (WhatsApp, Slack, correo, llamadas telefónicas o presencial).
  * Clasificar la naturaleza del incidente (Bug, Error de uso, Solicitud de mejora), definir prioridad, asignar a ingenieros especializados o desestimar con causal justificada.

### 3. Ingeniero de Soporte / Desarrollador (`responsable_atencion`)
* **Situación:** Especialista técnico o desarrollador interno de Datak asignado a la solución del incidente.
* **Trabajo a realizar:**
  * Gestionar su cola personal de trabajo técnico ("Mis Tickets Asignados").
  * Registrar notas internas de depuración, logs técnicos y análisis de causa raíz (estrictamente confidenciales e invisibles para el cliente).
  * Formalizar la resolución del caso documentando la solución aplicada y disparando las notificaciones correspondientes.

## Product Purpose
Datak Tickets es el sistema oficial de gestión de soporte e incidencias integrado al ecosistema Datak ERP. Su propósito es proveer una plataforma centralizada, ágil y confiable para canalizar requerimientos técnicos corporativos, garantizando trazabilidad absoluta mediante radicados formales (`TK-AAAA-NNNNNN`), preservando la confidencialidad de ingeniería y optimizando los tiempos de resolución.

## Positioning
Mesa de ayuda ERP con aislamiento multitenant estricto (RNF2) integrado a la contratación modular del cliente, preservación de confidencialidad de auditoría interna (RNF3: notas técnicas y nombres de ingenieros invisibles al cliente) y radicado secuencial único generado por el backend, con sincronización de eventos inmutables. A diferencia de mesas de ayuda genéricas desconectadas, Datak Tickets opera con validación nativa de pantallas, documentos y módulos contratados del ERP.

## Operating Context
* **Portal del Cliente:** Vistas `/tickets` (listado con búsqueda y filtros), `/tickets/nuevo` (formulario de reporte reactivo a módulos contratados), `/tickets/[radicado]` (detalle público y línea de tiempo) y chatbot asistente flotante en 4 pasos.
* **Consola de Soporte (Superdatak):** Vistas `/support/tickets` (bandeja unificada de alta densidad), `/support/tickets/[id]` (triaje, asignación y auditoría interna), `/support/tickets/nuevo` (ingesta manual de casos externos) y `/support/mis-tickets` (cola de trabajo personal con resolución y notas rápidas).
* **Entorno de ejecución:** Aplicación web de escritorio y móvil en navegadores modernos (Chrome, Firefox, Safari, Edge), conectada a servicios API REST autenticados por JWT.

## Capabilities and Constraints
* **Arquitectura:** Nuxt 4 (SSR/Node Server) + Nuxt UI (v2) + Pinia + TailwindCSS + TypeScript.
* **Backend:** Django REST Framework + PostgreSQL / SQLite con autenticación JWT Bearer.
* **Multi-Tenancy Estricto (RNF2):** La empresa cliente se infiere exclusivamente de los claims del JWT de sesión. Prohibido enviar o permitir manipulación de `empresa_id` en peticiones de cliente. Consultas cruzadas entre tenants retornan `404 Not Found`.
* **Confidencialidad de Auditoría (RNF3):** Las notas internas (`es_interna=True`) y la identidad del ingeniero responsable nunca se exponen al cliente.
* **Inmutabilidad de Auditoría (RNF5):** El historial de eventos (`TicketItem`) es estrictamente de adición (*append-only*); no permite modificaciones ni eliminaciones.
* **Contrato de Lenguaje:** Código fuente 100% en inglés (variables, tipos, servicios, tests). Interfaz gráfica, etiquetas y mensajes 100% en español colombiano.

## Brand Commitments
* **Identidad:** Datak ERP / Superdatak.
* **Franja de Marca Datak:** Línea decorativa superior fija de 2px de altura con gradiente ámbar (`linear-gradient(to right, #f59e0b, #d97706)`).
* **Color Primario (Morado Datak `#a855f7`):** Sujeto a la Regla de la Señal Única (máximo un botón sólido primario `color="primary" variant="solid"` por vista).
* **Iconografía:** Familia Lucide Icons (`i-lucide-*`), con prohibición explícita de emojis en badges, tablas o estados.
* **Tipografía:** Familia Poppins bajo la Regla de los Dos Pesos (normal 400 y semibold 600). Cifras, fechas y radicados en `tabular-nums`.

## Evidence on Hand
* Repositorio frontend `tickets-datak-frontend` con 38 suites de prueba y 213 pruebas unitarias e integrales aprobadas.
* Repositorio backend `tickets-datak-backend` con arquitectura de modelos, serializadores y pruebas de aislamiento validadas.
* Guías de diseño y tokens de referencia en `datak/app/DESIGN.md`, `datak/app/RULES.md` y `datak/superdatak/DESIGN.md`.

## Product Principles
1. **La Regla de la Señal Única:** El color primario morado y el relleno sólido guían la acción principal de la pantalla sin competir ni saturar visualmente.
2. **Confidencialidad Rigurosa por Diseño:** El cliente corporativo solo ve información pública de su caso; la investigación técnica y la identidad del desarrollador permanecen protegidas.
3. **Trazabilidad Inmutable:** Cada radicado, asignación, reclasificación, nota interna y resolución queda registrada cronológicamente sin posibilidad de edición posterior.
4. **Precisión Operativa sin Adornos:** Interfaces de alta densidad de información, dos pesos tipográficos claros, números tabulares y cero emojis decorativos.

## Accessibility & Inclusion
* Cumplimiento con estándar WCAG 2.1 nivel AA en contraste tipográfico sobre superficies claras y oscuras.
* Soporte exhaustivo para navegación por teclado, focus rings temáticos morados tenue (`ring-primary-100` / `ring-primary-500`) y atributos ARIA (`aria-label`, `role="status"`, `role="alert"`).
