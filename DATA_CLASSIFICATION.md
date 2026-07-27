# Clasificación de Datos — La Mula Millonaria

**ISO 27001 A.8.2**

Última actualización: 27 de julio de 2026

---

## Niveles de Clasificación

### 🔴 CONFIDENCIAL (Nivel 1)

**Datos que requieren máxima protección. Acceso restringido solo al dueño.**

| Dato | Ubicación | Protección |
|------|-----------|------------|
| Contraseñas (hash) | Supabase Auth | Bcrypt, nunca expuestas |
| Tokens de sesión | Supabase Auth | JWT firmados, expiración corta |
| Datos de pago (si aplica) | Terceros (Stripe, etc.) | PCI-DSS, nunca almacenados localmente |

### 🟡 SENSIBLE (Nivel 2)

**Datos personales que requieren protección especial (GDPR/CCPA).**

| Dato | Ubicación | Protección |
|------|-----------|------------|
| Email | Supabase Auth + `profiles` | RLS, solo el dueño puede ver |
| Nombre de usuario | `profiles` | RLS, lectura pública (ranking) |
| Avatar | `profiles` | RLS, lectura pública |
| Progreso del juego | `game_state` | RLS, solo el dueño puede ver/editar |
| Transacciones | `transactions` | RLS, solo el dueño puede ver |
| Amigos | `friends` | RLS, solo participantes pueden ver |

### 🟢 INTERNO (Nivel 3)

**Datos de uso interno que no son públicos pero no son sensibles.**

| Dato | Ubicación | Protección |
|------|-----------|------------|
| Logs de seguridad | localStorage (cifrado) | Cifrado AES-GCM |
| Configuración de la app | localStorage (cifrado) | Cifrado AES-GCM |
| Métricas de uso | Supabase (futuro) | Agregadas, anonimizadas |

### ⚪ PÚBLICO (Nivel 4)

**Datos que son públicos por diseño.**

| Dato | Ubicación | Protección |
|------|-----------|------------|
| Ranking global | `leaderboard_global` | RLS, lectura pública |
| Nombre de usuario | `profiles` | RLS, lectura pública |
| Avatar | `profiles` | RLS, lectura pública |
| Nivel | `profiles` | RLS, lectura pública |

---

## Manejo por Nivel

### 🔴 CONFIDENCIAL

- **Almacenamiento:** Cifrado en reposo (Supabase), nunca en localStorage
- **Transmisión:** HTTPS/TLS, nunca en logs
- **Acceso:** Solo el dueño, autenticación requerida
- **Retención:** Mínimo necesario, eliminación segura al cerrar cuenta
- **Backup:** Cifrado, acceso restringido

### 🟡 SENSIBLE

- **Almacenamiento:** Cifrado en reposo (Supabase), cifrado en localStorage (AES-GCM)
- **Transmisión:** HTTPS/TLS
- **Acceso:** Solo el dueño (RLS), autenticación requerida
- **Retención:** Mientras la cuenta esté activa, eliminación al cerrar cuenta
- **Backup:** Cifrado, acceso restringido

### 🟢 INTERNO

- **Almacenamiento:** Cifrado en localStorage (AES-GCM)
- **Transmisión:** HTTPS/TLS (si se envía al servidor)
- **Acceso:** Solo la app, no expuesto a otros usuarios
- **Retención:** 90 días (logs de seguridad), indefinido (configuración)
- **Backup:** No aplica (localStorage)

### ⚪ PÚBLICO

- **Almacenamiento:** Sin cifrar (Supabase)
- **Transmisión:** HTTPS/TLS
- **Acceso:** Público (lectura), autenticación para escritura
- **Retención:** Indefinido
- **Backup:** Incluido en backups de Supabase

---

## Etiquetado

**Todos los datos deben estar etiquetados con su nivel de clasificación:**

- En la base de datos: comentarios en las tablas
- En el código: comentarios JSDoc
- En la documentación: este archivo

**Ejemplo:**
```sql
-- Tabla: profiles
-- Clasificación: 🟡 SENSIBLE (email), ⚪ PÚBLICO (username, avatar)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,  -- ⚪ PÚBLICO
  avatar_url text,  -- ⚪ PÚBLICO
  level integer not null default 1  -- ⚪ PÚBLICO
);
```

---

## Revisión

**Frecuencia:** Anual o cuando se agreguen nuevos tipos de datos

**Responsable:** Responsable de Seguridad

**Aprobación:** Dirección
