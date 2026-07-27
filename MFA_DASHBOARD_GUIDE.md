# Guía Paso a Paso: Habilitar MFA en Supabase Dashboard

**Para:** Harry Vizcaíno (Product Owner)
**Proyecto:** La Mula Millonaria
**Fecha:** 27 de julio de 2026

---

## Paso 1: Acceder al Dashboard de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto **La Mula Millonaria** (project ID: `cjmjpjdbfzekcldbdpti`)

---

## Paso 2: Habilitar MFA

1. En el menú lateral, ve a **Authentication**
2. Haz clic en **Settings**
3. Desplázate hasta **Multi-Factor Authentication**
4. Activa el toggle **Enable TOTP**
5. Configura:
   - **Issuer:** `La Mula Millonaria`
   - **Access Token Expiry:** `3600` (1 hora)
   - **Refresh Token Expiry:** `2592000` (30 días)
6. Haz clic en **Save**

---

## Paso 3: Verificar que MFA está Habilitado

1. Ve a **Authentication → Users**
2. Selecciona un usuario de prueba
3. En la pestaña **Factors**, deberías ver la opción de agregar TOTP

---

## Paso 4: Configurar Política de MFA (Opcional)

**¿Quién debe usar MFA?**

**Obligatorio:**
- Cuentas de administrador (Responsable de Seguridad, Equipo Técnico, Responsable Legal)
- Cuentas con acceso a datos sensibles (transacciones, pagos)

**Opcional:**
- Usuarios regulares (recomendado pero no obligatorio)

**¿Cuándo pedir MFA?**

**Siempre:**
- Login desde nuevo dispositivo
- Cambios de configuración de seguridad (email, contraseña, MFA)
- Acceso a datos sensibles (exportar datos, eliminar cuenta)

**Opcional:**
- Cada login (más seguro pero más fricción)
- Solo en acciones sensibles (más usabilidad)

---

## Paso 5: Implementar en la App

**El código ya está implementado en `src/components/MFASettings.tsx`**

**Próximos pasos:**
1. Agregar el componente a la página de configuración
2. Implementar el flujo de login con MFA
3. Probar con un usuario de prueba

---

## Troubleshooting

### No veo la opción de MFA en el Dashboard

**Solución:** Asegúrate de que tu plan de Supabase incluye MFA. MFA está disponible en todos los planes (gratuito, Pro, Team, Enterprise).

### Error al habilitar MFA

**Solución:** Verifica que el proyecto está activo y que tienes permisos de administrador.

### MFA no funciona en la app

**Solución:**
1. Verifica que MFA está habilitado en el Dashboard
2. Verifica que el código de la app está actualizado
3. Verifica que el usuario tiene MFA registrado (Authentication → Users → [Usuario] → Factors)

---

## Referencias

- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [MFA_SETUP.md](./MFA_SETUP.md) — Documentación técnica completa
- [src/components/MFASettings.tsx](./src/components/MFASettings.tsx) — Componente de la app

---

**¿Necesitas ayuda?** Contacta a support@supabase.io o revisa la documentación oficial.
