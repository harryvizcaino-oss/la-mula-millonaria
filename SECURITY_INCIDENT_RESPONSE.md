# Plan de Respuesta a Incidentes de Seguridad

**La Mula Millonaria — ISO 27001 A.16**

Última actualización: 27 de julio de 2026

---

## 1. Objetivo

Establecer un proceso estructurado para detectar, responder y recuperarse de incidentes de seguridad que afecten la confidencialidad, integridad o disponibilidad de la información de La Mula Millonaria.

---

## 2. Alcance

Este plan aplica a todos los incidentes de seguridad que afecten:
- Datos de usuarios (cuentas, progreso, transacciones)
- Infraestructura (servidores, bases de datos, APIs)
- Aplicaciones (web, móvil)
- Comunicaciones (HTTPS, WSS, Realtime)

---

## 3. Clasificación de Incidentes

### 3.1 Por Severidad

| Nivel | Descripción | Ejemplos | Tiempo de Respuesta |
|-------|-------------|----------|---------------------|
| **P1 - Crítico** | Brecha de datos activa, servicio completamente caído | Fuga masiva de datos de usuarios, ransomware | Inmediato (< 1 hora) |
| **P2 - Alto** | Vulnerabilidad crítica explotable, acceso no autorizado | SQL injection, XSS activo, cuenta comprometida | < 4 horas |
| **P3 - Medio** | Vulnerabilidad potencial, intento de acceso fallido | Intento de fuerza bruta, vulnerabilidad detectada | < 24 horas |
| **P4 - Bajo** | Problema menor, mejora de seguridad | Actualización de dependencia, mejora de configuración | < 72 horas |

### 3.2 Por Tipo

- **Brecha de datos:** acceso no autorizado a datos de usuarios
- **Acceso no autorizado:** login sospechoso, cuenta comprometida
- **Malware:** virus, ransomware, spyware
- **DoS/DDoS:** denegación de servicio
- **Phishing:** intento de robo de credenciales
- **Vulnerabilidad:** fallo de seguridad en código o configuración

---

## 4. Roles y Responsabilidades

| Rol | Responsabilidad | Contacto |
|-----|-----------------|----------|
| **Responsable de Seguridad** | Coordinar respuesta, comunicar con stakeholders | security@lamulamillonaria.com |
| **Equipo Técnico** | Contener, erradicar y recuperar | dev@lamulamillonaria.com |
| **Responsable Legal** | Evaluar obligaciones legales (GDPR, CCPA) | legal@lamulamillonaria.com |
| **Responsable de Comunicación** | Comunicar con usuarios afectados | support@lamulamillonaria.com |

---

## 5. Proceso de Respuesta

### 5.1 Detección

**Fuentes de detección:**
- Logs de seguridad (Supabase, Vercel)
- Alertas de monitoreo (uptime, errores)
- Reportes de usuarios
- Auditorías de seguridad

**Acción inmediata:**
1. Registrar fecha/hora de detección
2. Clasificar severidad y tipo
3. Notificar al Responsable de Seguridad

### 5.2 Contención

**Objetivo:** Limitar el alcance del incidente

**Acciones:**
- **P1 (Crítico):** Desconectar sistemas afectados, bloquear accesos
- **P2 (Alto):** Aislar cuentas comprometidas, parchear vulnerabilidad
- **P3 (Medio):** Monitorear actividad sospechosa, reforzar controles
- **P4 (Bajo):** Documentar, planificar corrección

### 5.3 Erradicación

**Objetivo:** Eliminar la causa raíz

**Acciones:**
- Parchear vulnerabilidades
- Eliminar malware
- Restablecer credenciales comprometidas
- Corregir configuraciones inseguras

### 5.4 Recuperación

**Objetivo:** Restaurar operaciones normales

**Acciones:**
- Restaurar desde backups (Supabase tiene backups automáticos)
- Verificar integridad de datos
- Monitorear sistemas restaurados
- Comunicar a usuarios afectados

### 5.5 Lecciones Aprendidas

**Objetivo:** Prevenir incidentes futuros

**Acciones:**
- Documentar causa raíz
- Actualizar controles de seguridad
- Capacitar al equipo
- Actualizar este plan

---

## 6. Notificación de Brechas (GDPR Art. 33-34)

### 6.1 Notificación a Autoridades

**Plazo:** 72 horas desde la detección

**Contenido:**
- Naturaleza de la brecha
- Categorías y número de usuarios afectados
- Consecuencias probables
- Medidas tomadas o propuestas

**Autoridad:** Agencia de Protección de Datos (Colombia) o autoridad equivalente

### 6.2 Notificación a Usuarios

**Cuándo:** Si la brecha puede resultar en alto riesgo para derechos y libertades

**Contenido:**
- Descripción clara de la brecha
- Contacto del Responsable de Seguridad
- Medidas tomadas
- Recomendaciones para el usuario (cambiar contraseña, etc.)

**Canal:** Email, notificación en la app, o ambos

---

## 7. Comunicación

### 7.1 Interna

- **P1/P2:** Notificación inmediata al equipo por Slack/Email
- **P3/P4:** Notificación en reunión semanal

### 7.2 Externa

- **Usuarios afectados:** Email + notificación en la app
- **Público general:** Solo si es requerido por ley o si hay riesgo significativo
- **Medios:** Solo a través del Responsable de Comunicación

---

## 8. Documentación

**Registrar todos los incidentes en:**
- Fecha/hora de detección
- Tipo y severidad
- Acciones tomadas
- Tiempo de resolución
- Lecciones aprendidas

**Herramienta:** GitHub Issues con label `security-incident`

---

## 9. Revisión y Actualización

**Frecuencia:** Anual o después de cada incidente P1/P2

**Responsable:** Responsable de Seguridad

**Aprobación:** Dirección

---

## 10. Contactos de Emergencia

| Servicio | Contacto | Disponibilidad |
|----------|----------|----------------|
| **Supabase Support** | support@supabase.io | 24/7 (plan Pro) |
| **Vercel Support** | support@vercel.com | 24/7 (plan Pro) |
| **Responsable de Seguridad** | security@lamulamillonaria.com | 24/7 |
| **Equipo Técnico** | dev@lamulamillonaria.com | Horario laboral |

---

## 11. Anexos

### Anexo A: Plantilla de Reporte de Incidente

```markdown
**Fecha/hora de detección:** [YYYY-MM-DD HH:MM UTC]
**Detectado por:** [Nombre/Sistema]
**Tipo:** [Brecha de datos / Acceso no autorizado / etc.]
**Severidad:** [P1 / P2 / P3 / P4]

**Descripción:**
[Descripción detallada del incidente]

**Sistemas afectados:**
[Lista de sistemas, bases de datos, APIs]

**Usuarios afectados:**
[Número estimado, categorías de datos]

**Acciones tomadas:**
1. [Acción 1]
2. [Acción 2]

**Estado:** [En curso / Contenido / Resuelto]

**Lecciones aprendidas:**
[Qué se aprendió, cómo prevenir]
```

### Anexo B: Checklist de Respuesta

- [ ] Detectar y clasificar incidente
- [ ] Notificar al Responsable de Seguridad
- [ ] Contener el incidente
- [ ] Erradicar la causa raíz
- [ ] Recuperar operaciones
- [ ] Notificar a autoridades (si aplica)
- [ ] Notificar a usuarios afectados (si aplica)
- [ ] Documentar lecciones aprendidas
- [ ] Actualizar controles de seguridad
- [ ] Actualizar este plan

---

**Aprobado por:** [Nombre del Responsable]
**Fecha:** [Fecha de aprobación]
