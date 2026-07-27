# Proceso de Borrado Seguro — La Mula Millonaria

**ISO 27001 A.8.3 / GDPR Art. 17 (Derecho al Olvido)**

Última actualización: 27 de julio de 2026

---

## Objetivo

Garantizar que los datos personales se eliminen de forma segura e irreversible cuando:
- Un usuario ejerce su derecho al olvido (GDPR Art. 17)
- Un usuario cierra su cuenta
- Los datos ya no son necesarios para el propósito original

---

## Alcance

Este proceso aplica a todos los datos personales almacenados en:
- Supabase (base de datos)
- localStorage (dispositivo del usuario)
- Backups (Supabase)
- Logs de seguridad

---

## Proceso de Borrado

### 1. Solicitud de Borrado

**Canales:**
- Email: privacy@lamulamillonaria.com
- Configuración de la app (futuro): botón "Eliminar cuenta"

**Información requerida:**
- Email de la cuenta
- Confirmación de identidad (código de verificación por email)

**Plazo de respuesta:** 30 días (GDPR Art. 12)

### 2. Verificación de Identidad

**Antes de proceder, verificar que el solicitante es el dueño de la cuenta:**

1. Enviar código de verificación al email registrado
2. Confirmar que el código es correcto
3. Registrar la solicitud en logs de seguridad

### 3. Borrado de Datos

#### 3.1 Supabase (Base de Datos)

**Tablas a limpiar:**

```sql
-- 1. Eliminar amigos (relaciones)
DELETE FROM public.friends
WHERE user_id = '[USER_ID]' OR friend_id = '[USER_ID]';

-- 2. Eliminar transacciones
DELETE FROM public.transactions
WHERE user_id = '[USER_ID]';

-- 3. Eliminar estado del juego
DELETE FROM public.game_state
WHERE id = '[USER_ID]';

-- 4. Eliminar perfil
DELETE FROM public.profiles
WHERE id = '[USER_ID]';

-- 5. Eliminar de leaderboard (anonimizar)
UPDATE public.leaderboard_global
SET username = 'Usuario Eliminado',
    avatar_url = NULL
WHERE user_id = '[USER_ID]';

-- 6. Eliminar usuario de Auth (esto elimina todo lo anterior por CASCADE)
DELETE FROM auth.users
WHERE id = '[USER_ID]';
```

**Nota:** La eliminación de `auth.users` elimina automáticamente todas las filas relacionadas por `ON DELETE CASCADE`.

#### 3.2 localStorage (Dispositivo del Usuario)

**Datos a limpiar:**

```typescript
// Limpiar todos los datos locales
localStorage.clear();

// O específicamente:
localStorage.removeItem('truckSurfers_millas_v3');
localStorage.removeItem('truckSurfers_clicker_v5');
localStorage.removeItem('truckSurfers_daily_v1');
localStorage.removeItem('truckSurfers_unlocks_v1');
localStorage.removeItem('truckSurfers_powerups_v1');
localStorage.removeItem('truckSurfers_quests_v1');
localStorage.removeItem('truckSurfers_talents_v1');
localStorage.removeItem('truckSurfers_achievements_v1');
localStorage.removeItem('truckSurfers_lootboxes_v1');
localStorage.removeItem('truckSurfers_season_v1');
localStorage.removeItem('truckSurfers_routes_v1');
localStorage.removeItem('truckSurfers_customization_v1');
localStorage.removeItem('truckSurfers_league_v1');
localStorage.removeItem('truckSurfers_friends_v1');
localStorage.removeItem('truckSurfers_push_v1');
localStorage.removeItem('truckSurfers_session_rewards_v1');
localStorage.removeItem('truckSurfers_collectibles_v1');
localStorage.removeItem('truckSurfers_global_challenges_v1');
localStorage.removeItem('truckSurfers_cosmetic_pass_v1');
localStorage.removeItem('truckSurfers_sync_queue_v1');
localStorage.removeItem('lmm_security_log');
```

**Nota:** El usuario debe hacer esto manualmente en su dispositivo, o la app debe hacerlo automáticamente al confirmar el borrado.

#### 3.3 Backups (Supabase)

**Supabase tiene backups automáticos que se conservan por 7 días (plan gratuito) o 30 días (plan Pro).**

**Proceso:**
1. Los datos eliminados se marcan como "eliminados" en la base de datos
2. Los backups antiguos se sobrescriben con nuevos backups
3. Después de 7-30 días, los datos eliminados desaparecen de los backups

**Nota:** No es posible eliminar datos específicos de backups individuales. El borrado es efectivo después del período de retención del backup.

#### 3.4 Logs de Seguridad

**Logs de seguridad se conservan por 90 días para auditoría.**

**Proceso:**
1. Anonimizar logs que contengan datos personales del usuario
2. Eliminar logs después de 90 días

**Implementación:**
```typescript
// Anonimizar logs de un usuario específico
function anonymizeUserLogs(userId: string): void {
  const logs = getSecurityLogs();
  const anonymized = logs.map((log) => {
    if (log.userId === userId) {
      return {
        ...log,
        userId: 'deleted-user',
        email: undefined,
      };
    }
    return log;
  });
  localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(anonymized));
}
```

### 4. Confirmación de Borrado

**Después de completar el borrado:**

1. Enviar email de confirmación al usuario
2. Registrar el borrado en logs de seguridad (anonimizado)
3. Eliminar la solicitud de borrado de la cola

**Email de confirmación:**
```
Asunto: Confirmación de eliminación de cuenta

Hola,

Tu cuenta de La Mula Millonaria ha sido eliminada exitosamente.

Todos tus datos personales han sido eliminados de nuestros sistemas, excepto:
- Logs de seguridad (anonimizados, conservados por 90 días)
- Backups (eliminados automáticamente después de 7-30 días)

Gracias por haber jugado con nosotros.

Saludos,
El equipo de La Mula Millonaria
```

---

## Excepciones al Borrado

**No se pueden eliminar datos si:**
- Son necesarios para cumplir con obligaciones legales (ej. registros fiscales)
- Son necesarios para la defensa de reclamaciones legales
- El usuario no puede verificar su identidad

**En estos casos:**
- Informar al usuario de la razón
- Conservar solo los datos mínimos necesarios
- Eliminar cuando ya no sean necesarios

---

## Automatización

**Futuro:** Implementar borrado automático desde la app

```typescript
// Botón "Eliminar cuenta" en configuración
async function handleDeleteAccount() {
  // 1. Confirmar con el usuario
  const confirmed = confirm('¿Estás seguro? Esta acción es irreversible.');
  if (!confirmed) return;

  // 2. Enviar código de verificación
  await sendVerificationCode();

  // 3. Verificar código
  const code = prompt('Ingresa el código enviado a tu email:');
  if (!code) return;

  // 4. Eliminar cuenta
  await deleteAccount(code);

  // 5. Limpiar localStorage
  localStorage.clear();

  // 6. Redirigir a la página de inicio
  window.location.href = '/';
}
```

---

## Revisión

**Frecuencia:** Anual o cuando cambien las leyes de protección de datos

**Responsable:** Responsable de Seguridad

**Aprobación:** Dirección
