# Informe de Pruebas de Aceptación de Usuario (UAT) — Iteración 2
**Proyecto:** Sistema de Gestión de Tickets Datak  
**Iteración:** Iteración 2 — Consola Interna de Soporte, Triaje y Resolución  
**Fecha de Ejecución:** 22 de Noviembre de 2026  
**Responsable UAT:** Juan Diego Sarmiento (@juandiegosb)  
**Código de Tarea:** FE-23 (Issue #50)  
**Actividad MS Project:** MP-69  
**Historias de Usuario Cubiertas:** HU-02 (#41), HU-03 (#42)  
**Requerimientos Funcionales:** RF7, RF8, RF9, RF10, RF11, RF12, RF13, RF14, RF15, RF16  
**Requerimientos No Funcionales:** RNF2 (Aislamiento multi-inquilino), RNF3 (Seguridad y permisos RBAC), RNF5 (Inmutabilidad de auditoría)  

---

## 1. Resumen Ejecutivo y Alcance
El presente informe documenta la ejecución exhaustiva de las Pruebas de Aceptación de Usuario (UAT) correspondientes a la **Iteración 2** del Sistema de Tickets Datak. Las pruebas se realizaron contra el despliegue integrado del backend Django REST Framework y el frontend Nuxt 3 con datos realistas multi-tenant poblados mediante el comando `seed_data`.

El objetivo principal fue validar de extremo a extremo el ciclo de vida de atención y soporte interno:
1. Seguridad perimetral y control de acceso basado en roles (RBAC) para el personal de soporte e ingeniería.
2. Bandeja de entrada unificada de soporte con filtros avanzados multitenant.
3. Radicación manual de incidencias externas recibidas por canales tradicionales (teléfono, correo, presencial).
4. Triaje, clasificación técnica y asignación de responsables.
5. Cola personal de trabajo del ingeniero de atención y gestión de notas internas confidenciales.
6. Resolución formal con justificación técnica o desestimación motivada.
7. Notificaciones proactivas al cliente en el portal web ante resolución o cierre.

---

## 2. Entorno y Cuentas de Prueba Utilizadas

| Rol en el Sistema | Correo de Prueba | Contraseña | Organización / Empresa |
| :--- | :--- | :--- | :--- |
| **Cliente Acme** | `cliente@acme.com` | `test123456` | Acme Industrial S.A.S. |
| **Cliente Global** | `cliente@global.com` | `test123456` | Global Logistics Ltda. |
| **Agente de Soporte** | `agente@datak.co` | `test123456` | Datak Support Team (Staff) |
| **Agente de Soporte Auxiliar** | `soporte@datak.co` | `test123456` | Datak Support Team (Staff) |
| **Ingeniera / Responsable** | `dev@datak.co` | `test123456` | Datak Engineering Team (Staff) |
| **Responsable de Atención** | `responsable@datak.co` | `test123456` | Datak Engineering Team (Staff) |

---

## 3. Matriz de Casos de Prueba UAT Ejecutados

| ID | Requerimiento | Escenario / Flujo de Prueba | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UAT-01** | RNF3 / RBAC | Intento de acceso de cliente a `/support/**` | Redirección automática a `/tickets` o `/login` bloqueando acceso no autorizado. | El middleware `support.ts` detecta rol `cliente` y redirige a `/tickets`. | **APROBADO** |
| **UAT-02** | RF7 | Bandeja unificada de tickets de soporte | Visualización tabular de tickets de todas las empresas con filtros por Estado, Empresa y Prioridad. | La tabla lista radicados de Acme y Global; los selectores filtran en tiempo real. | **APROBADO** |
| **UAT-03** | RF8 | Radicación de ticket externo por agente | Formulario en `/support/tickets/nuevo` permite seleccionar empresa, módulo activo, canal y prioridad. | Se genera radicado formal `TK-2026-XXXXXX` con `canal_origen` correspondiente. | **APROBADO** |
| **UAT-04** | RF9 / RNF5 | Detalle y línea de tiempo de auditoría | Consulta de radicado en `/support/tickets/[radicado]` muestra historial inmutable y datos generales. | Timeline cronológico muestra eventos de creación, actor y marcas de tiempo. | **APROBADO** |
| **UAT-05** | RF10 | Triaje y clasificación de ticket | Agente clasifica incidencia como `Bug`, `Error de uso` o `Solicitud de mejora` y ajusta prioridad. | El ticket actualiza clasificación y se registra evento en la auditoría inmutable. | **APROBADO** |
| **UAT-06** | RF11 | Asignación de responsable | Agente asigna el ticket a `dev@datak.co` con observaciones opcionales. | El estado pasa a `En gestión`, se asigna el usuario y se audita el evento. | **APROBADO** |
| **UAT-07** | RF12 | Desestimación de ticket (No procedente) | Agente marca como no procedente con motivo obligatorio (mínimo 10 caracteres). | Estado pasa a `No procedente`, guarda `motivo_no_procedente` y bloquea edición. | **APROBADO** |
| **UAT-08** | RF13 | Cola de trabajo del ingeniero | Ingeniero consulta `/support/mis-tickets` viendo únicamente los asignados a su usuario. | `dev@datak.co` ve sus incidencias asignadas en estado `En gestión` y `Resuelto`. | **APROBADO** |
| **UAT-09** | RF14 / RNF3 | Notas internas confidenciales | Ingeniero añade nota interna técnica. Cliente consulta el ticket desde su portal. | La nota es visible para staff de soporte pero **completamente oculta** para el cliente. | **APROBADO** |
| **UAT-10** | RF15 | Resolución formal de ticket | Ingeniero completa solución con comentario detallado obligatorio. | Estado pasa a `Resuelto`, registra fecha de resolución y comentario final. | **APROBADO** |
| **UAT-11** | RF16 | Campana de notificaciones del cliente | Cliente ingresa al portal; campana muestra badge rojo con conteo de no leídas. | Badge muestra conteo real; dropdown lista aviso con link directo al ticket. | **APROBADO** |
| **UAT-12** | RF16 | Marcado de notificación como leída | Cliente hace clic en la notificación del dropdown. | Notificación se marca como leída en backend (`PATCH`), badge decrementa. | **APROBADO** |
| **UAT-13** | RNF2 | Aislamiento multi-inquilino de notificaciones | Cliente Global consulta notificaciones en `/api/v1/client/notificaciones/`. | Solo recibe notificaciones de su propia empresa (Global Logistics Ltda.). | **APROBADO** |

---

## 4. Hallazgos, Comportamientos Verificados y Regresiones
1. **Confidencialidad de Notas Internas (RNF3/RNF5):**
   Se verificó en base de datos y a nivel de serializers DRF (`ClientTicketDetailSerializer` vs `SupportTicketDetailSerializer`) que los registros `TicketItem` con `es_interna=True` son filtrados estrictamente en el endpoint público del cliente (`GET /api/v1/tickets/{radicado}/`), garantizando que notas técnicas o discusiones internas entre agentes e ingenieros jamás se filtren al cliente final.
2. **Idempotencia y Resiliencia en Semillero (`seed_data`):**
   El comando `python manage.py seed_data` corre de forma atómica e idempotente sin duplicar empresas, módulos, usuarios ni eventos inmutables de auditoría, incluyendo los registros de `TicketNotificacion`.
3. **Optimización de Rendimiento en Tests:**
   La incorporación de `MD5PasswordHasher` para entornos de pruebas permite ejecutar los 263 tests de backend en tan solo 8.39 segundos y los 210 tests de frontend en 25 segundos, facilitando la integración continua.

---

## 5. Conclusión y Veredicto de Aceptación
Todos los criterios de aceptación estipulados en las Historias de Usuario **HU-02** y **HU-03**, así como los requerimientos funcionales **RF7 al RF16**, han sido validados exitosamente con una tasa de éxito del **100% (13/13 escenarios UAT aprobados)**. 

El producto se encuentra listo y certificado para el Showcase y entrega de la Iteración 2.

**Firmado para constancia:**  
*Juan Diego Sarmiento — Representante de Calidad y Pruebas UAT*  
*Equipo AnorakTeam — Datak S.A.S.*
