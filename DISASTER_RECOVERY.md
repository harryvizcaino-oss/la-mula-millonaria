# Plan de Recuperación ante Desastres — La Mula Millonaria

**ISO 27001 A.17**

Última actualización: 27 de julio de 2026

---

## Objetivo

Garantizar la continuidad del negocio y la recuperación de operaciones en caso de desastre (caída de servicio, pérdida de datos, ataque cibernético).

---

## Escenarios de Desastre

### 1. Caída de Supabase (Base de Datos)

**Impacto:** Alto (usuarios no pueden guardar/cargar progreso)

**Probabilidad:** Baja (Supabase tiene SLA de 99.9%)

**Recuperación:**
- **RTO (Recovery Time Objective):** 4 horas
- **RPO (Recovery Point Objective):** 24 horas (backups diarios)

**Pasos:**
1. Verificar estado de Supabase (status.supabase.com)
2. Si es caída temporal, esperar a que se restaure
3. Si es caída prolongada, activar modo offline (localStorage)
4. Comunicar a usuarios por email/notificación

### 2. Caída de Vercel (Hosting)

**Impacto:** Alto (usuarios no pueden acceder a la app)

**Probabilidad:** Baja (Vercel tiene SLA de 99.99%)

**Recuperación:**
- **RTO:** 1 hora
- **RPO:** 0 (no hay pérdida de datos, solo acceso)

**Pasos:**
1. Verificar estado de Vercel (vercel-status.com)
2. Si es caída temporal, esperar a que se restaure
3. Si es caída prolongada, desplegar en servicio alternativo (Netlify, Cloudflare Pages)
4. Actualizar DNS para apuntar al nuevo servicio

### 3. Pérdida de Datos (Base de Datos Corrupta)

**Impacto:** Crítico (usuarios pierden progreso)

**Probabilidad:** Muy baja (Supabase tiene replicación automática)

**Recuperación:**
- **RTO:** 4 horas
- **RPO:** 24 horas (backups diarios)

**Pasos:**
1. Identificar el alcance de la pérdida
2. Restaurar desde backup más reciente
3. Verificar integridad de datos
4. Comunicar a usuarios afectados

### 4. Ataque Cibernético (Ransomware, DDoS)

**Impacto:** Crítico (datos comprometidos o servicio caído)

**Probabilidad:** Baja (Supabase y Vercel tienen protección DDoS)

**Recuperación:**
- **RTO:** 8 horas
- **RPO:** 24 horas (backups diarios)

**Pasos:**
1. Activar plan de respuesta a incidentes (ver `SECURITY_INCIDENT_RESPONSE.md`)
2. Aislar sistemas afectados
3. Restaurar desde backup limpio
4. Investigar causa raíz
5. Reforzar controles de seguridad

---

## Infraestructura de Respaldo

### Backups Automáticos (Supabase)

**Frecuencia:** Diaria
**Retención:** 7 días (plan gratuito), 30 días (plan Pro)
**Ubicación:** Misma región que la base de datos (replicación automática)

**Verificación:**
```bash
# Verificar backups disponibles
npx supabase db dump --linked --data-only > backup-$(date +%Y%m%d).sql
```

### Backups Manuales (Recomendado)

**Frecuencia:** Semanal
**Retención:** 90 días
**Ubicación:** Almacenamiento externo (Google Drive, AWS S3, etc.)

**Proceso:**
```bash
# Backup completo de la base de datos
npx supabase db dump --linked > backup-full-$(date +%Y%m%d).sql

# Backup solo de datos (sin esquema)
npx supabase db dump --linked --data-only > backup-data-$(date +%Y%m%d).sql

# Subir a almacenamiento externo
# (manual o con script de automatización)
```

### Código Fuente (Git)

**Repositorio:** GitHub
**Frecuencia:** Cada commit
**Retención:** Indefinida

**Recuperación:**
```bash
# Clonar repositorio
git clone https://github.com/tuusuario/la-mula-millonaria.git

# Restaurar a commit específico
git checkout [COMMIT_HASH]
```

---

## Procedimiento de Recuperación

### Paso 1: Evaluación del Desastre

**Acciones:**
1. Identificar el tipo de desastre
2. Evaluar el alcance (qué sistemas/datos afectados)
3. Estimar tiempo de recuperación
4. Notificar al equipo

**Responsable:** Responsable de Seguridad

### Paso 2: Activación del Plan

**Acciones:**
1. Activar modo offline (si aplica)
2. Comunicar a usuarios (email, notificación)
3. Iniciar proceso de recuperación
4. Documentar acciones tomadas

**Responsable:** Equipo Técnico

### Paso 3: Recuperación de Datos

**Acciones:**
1. Restaurar desde backup más reciente
2. Verificar integridad de datos
3. Sincronizar con clientes (si aplica)
4. Validar funcionalidad

**Responsable:** Equipo Técnico

### Paso 4: Restauración de Servicio

**Acciones:**
1. Verificar que todos los sistemas funcionan
2. Monitorear errores/anomalías
3. Comunicar a usuarios que el servicio está restaurado
4. Desactivar modo offline (si aplica)

**Responsable:** Equipo Técnico

### Paso 5: Post-Mortem

**Acciones:**
1. Documentar causa raíz
2. Evaluar efectividad del plan
3. Actualizar plan si es necesario
4. Capacitar al equipo

**Responsable:** Responsable de Seguridad

---

## Comunicación

### Interna

- **Canal:** Slack/Email
- **Frecuencia:** Cada 2 horas durante la recuperación
- **Contenido:** Estado, acciones tomadas, próximos pasos

### Externa

- **Canal:** Email, notificación en la app, redes sociales
- **Frecuencia:** Al inicio, cada 4 horas, al final
- **Contenido:** Qué pasó, qué estamos haciendo, cuándo se restaurará

**Plantilla de comunicación:**
```
Asunto: [URGENTE] Interrupción del servicio — La Mula Millonaria

Hola,

Estamos experimentando una interrupción del servicio debido a [causa].

**Qué pasó:** [Descripción breve]
**Impacto:** [Qué servicios/datos afectados]
**Qué estamos haciendo:** [Acciones de recuperación]
**Tiempo estimado de recuperación:** [RTO]

Te mantendremos informado cada 4 horas.

Gracias por tu paciencia.

El equipo de La Mula Millonaria
```

---

## Pruebas del Plan

**Frecuencia:** Trimestral

**Tipos de prueba:**
1. **Simulacro de caída:** Simular caída de Supabase/Vercel
2. **Restauración de backup:** Verificar que los backups se pueden restaurar
3. **Comunicación:** Verificar que los canales de comunicación funcionan

**Responsable:** Responsable de Seguridad

---

## Contactos de Emergencia

| Servicio | Contacto | Disponibilidad |
|----------|----------|----------------|
| **Supabase Support** | support@supabase.io | 24/7 (plan Pro) |
| **Vercel Support** | support@vercel.com | 24/7 (plan Pro) |
| **Responsable de Seguridad** | security@lamulamillonaria.com | 24/7 |
| **Equipo Técnico** | dev@lamulamillonaria.com | Horario laboral |

---

## Revisión

**Frecuencia:** Anual o después de cada desastre

**Responsable:** Responsable de Seguridad

**Aprobación:** Dirección
