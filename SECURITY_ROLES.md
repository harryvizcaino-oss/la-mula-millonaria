# Asignación de Roles de Seguridad — La Mula Millonaria

**ISO 27001 A.6.1**

Última actualización: 27 de julio de 2026

---

## Roles y Responsabilidades

### 1. Responsable de Seguridad (CISO)

**Asignado a:** [Nombre del responsable]
**Email:** security@lamulamillonaria.com
**Disponibilidad:** 24/7 (para incidentes P1/P2)

**Responsabilidades:**
- Coordinar la respuesta a incidentes de seguridad
- Revisar y aprobar cambios de seguridad
- Mantener actualizados los documentos de seguridad (este, políticas, planes)
- Realizar auditorías de seguridad trimestrales
- Capacitar al equipo en seguridad
- Comunicar brechas de seguridad a autoridades y usuarios

**Autoridad:**
- Puede detener despliegues por razones de seguridad
- Puede revocar accesos de usuarios sospechosos
- Puede activar el plan de respuesta a incidentes

---

### 2. Equipo Técnico (DevSecOps)

**Asignado a:** [Nombres del equipo]
**Email:** dev@lamulamillonaria.com
**Disponibilidad:** Horario laboral

**Responsabilidades:**
- Implementar controles de seguridad en el código
- Corregir vulnerabilidades de dependencias
- Revisar código de seguridad (code review)
- Mantener actualizadas las dependencias
- Configurar y mantener herramientas de seguridad (SAST, logs, etc.)

**Autoridad:**
- Puede proponer cambios de seguridad
- Puede pausar despliegues si detecta vulnerabilidades críticas

---

### 3. Responsable Legal (DPO)

**Asignado a:** [Nombre del responsable]
**Email:** legal@lamulamillonaria.com
**Disponibilidad:** Horario laboral

**Responsabilidades:**
- Asegurar cumplimiento de GDPR, CCPA y otras leyes de protección de datos
- Revisar y aprobar políticas de privacidad y términos de servicio
- Responder a solicitudes de derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)
- Comunicar brechas de datos a autoridades (GDPR Art. 33)
- Asesorar en temas legales de seguridad

**Autoridad:**
- Puede bloquear funcionalidades que violen leyes de protección de datos
- Puede requerir cambios en políticas de privacidad

---

### 4. Responsable de Comunicación

**Asignado a:** [Nombre del responsable]
**Email:** support@lamulamillonaria.com
**Disponibilidad:** Horario laboral

**Responsabilidades:**
- Comunicar incidentes de seguridad a usuarios afectados
- Responder a preguntas de usuarios sobre seguridad
- Mantener informada a la comunidad sobre mejoras de seguridad
- Coordinar con el Responsable de Seguridad en caso de brechas

**Autoridad:**
- Puede comunicar incidentes a usuarios (con aprobación del Responsable de Seguridad)
- Puede publicar avisos de seguridad en la app

---

### 5. Dueño del Producto (Product Owner)

**Asignado a:** Harry Vizcaíno
**Email:** harry@autofleet.com
**Disponibilidad:** Horario laboral

**Responsabilidades:**
- Priorizar mejoras de seguridad en el roadmap
- Aprobar presupuesto para herramientas de seguridad
- Asegurar que la seguridad sea parte del proceso de desarrollo
- Revisar métricas de seguridad (vulnerabilidades, incidentes, etc.)

**Autoridad:**
- Puede aprobar cambios de seguridad
- Puede asignar recursos para mejoras de seguridad

---

## Matriz de Responsabilidades (RACI)

| Actividad | Responsable de Seguridad | Equipo Técnico | Responsable Legal | Responsable de Comunicación | Product Owner |
|-----------|-------------------------|----------------|-------------------|----------------------------|---------------|
| **Respuesta a incidentes** | R/A | C | C | I | I |
| **Corrección de vulnerabilidades** | A | R | I | I | I |
| **Revisión de código** | C | R/A | I | I | I |
| **Actualización de dependencias** | I | R/A | I | I | I |
| **Políticas de privacidad** | C | I | R/A | I | I |
| **Términos de servicio** | C | I | R/A | I | I |
| **Derechos ARCO** | C | C | R/A | I | I |
| **Notificación de brechas** | R | C | A | R | I |
| **Comunicación a usuarios** | C | I | C | R/A | I |
| **Auditorías de seguridad** | R/A | C | C | I | I |
| **Capacitación en seguridad** | R/A | C | C | C | I |

**Leyenda:**
- **R** = Responsible (hace el trabajo)
- **A** = Accountable (responsable final)
- **C** = Consulted (consultado)
- **I** = Informed (informado)

---

## Proceso de Asignación

### Paso 1: Identificar Candidatos

**Criterios:**
- Conocimiento técnico (para Equipo Técnico)
- Conocimiento legal (para Responsable Legal)
- Disponibilidad (para Responsable de Seguridad)
- Autoridad (para Product Owner)

### Paso 2: Asignar Roles

**Documentar:**
- Nombre del responsable
- Email de contacto
- Disponibilidad
- Fecha de asignación

**Aprobar:**
- Dirección (para Responsable de Seguridad y Responsable Legal)
- Product Owner (para Equipo Técnico y Responsable de Comunicación)

### Paso 3: Capacitar

**Temas:**
- Responsabilidades del rol
- Procesos de seguridad (respuesta a incidentes, derechos ARCO, etc.)
- Herramientas de seguridad (SAST, logs, etc.)
- Contactos de emergencia

### Paso 4: Revisar

**Frecuencia:** Anual o cuando cambien los roles

**Responsable:** Product Owner

**Aprobación:** Dirección

---

## Contactos de Emergencia

| Rol | Nombre | Email | Teléfono | Disponibilidad |
|-----|--------|-------|----------|----------------|
| **Responsable de Seguridad** | Harry Vizcaíno (temporal) | security@lamulamillonaria.com | [Completar] | 24/7 |
| **Equipo Técnico** | Harry Vizcaíno (temporal) | dev@lamulamillonaria.com | [Completar] | Horario laboral |
| **Responsable Legal** | [Completar] | legal@lamulamillonaria.com | [Completar] | Horario laboral |
| **Responsable de Comunicación** | [Completar] | support@lamulamillonaria.com | [Completar] | Horario laboral |
| **Product Owner** | Harry Vizcaíno | harry@autofleet.com | [Completar] | Horario laboral |

---

## Revisión

**Frecuencia:** Anual o cuando cambien los roles

**Responsable:** Product Owner

**Aprobación:** Dirección

---

**Nota:** Este documento debe ser completado con los nombres reales de los responsables antes de ser aprobado.
