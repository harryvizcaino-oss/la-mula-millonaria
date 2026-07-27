# Guía Paso a Paso: Configurar Google OAuth Correctamente

**Para:** Harry Vizcaíno (Product Owner)
**Proyecto:** La Mula Millonaria
**Fecha:** 27 de julio de 2026

---

## Problema 1: Google OAuth pide acceso al ID del proyecto de Supabase

**Causa:** En Google Cloud Console, el nombre de la aplicación no está configurado correctamente.

**Solución:**

### Paso 1: Ir a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona el proyecto que usaste para Google OAuth

### Paso 2: Configurar la pantalla de consentimiento

1. Ve a **APIs & Services → OAuth consent screen**
2. Configura:
   - **App name:** `La Mula Millonaria`
   - **User support email:** tu email
   - **App logo:** (opcional) sube el logo de la app
   - **Application home page:** `https://la-mula-millonaria.vercel.app`
   - **Application privacy policy link:** `https://la-mula-millonaria.vercel.app/privacy-policy.html`
   - **Application terms of service link:** `https://la-mula-millonaria.vercel.app/terms-of-service.html`
   - **Authorized domains:** `supabase.co`, `vercel.app`
3. Haz clic en **Save and Continue**

### Paso 3: Configurar credenciales

1. Ve a **APIs & Services → Credentials**
2. Haz clic en tu **OAuth 2.0 Client ID**
3. Verifica que esté configurado:
   - **Application type:** Web application
   - **Name:** La Mula Millonaria
   - **Authorized JavaScript origins:** `https://cjmjpjdbfzekcldbdpti.supabase.co`
   - **Authorized redirect URIs:** `https://cjmjpjdbfzekcldbdpti.supabase.co/auth/v1/callback`
4. Haz clic en **Save**

---

## Problema 2: Después de iniciar sesión, te lleva a login en Vercel

**Causa:** La URL de redirección de OAuth no está configurada correctamente, o hay un problema con el flujo de autenticación.

**Solución:**

### Paso 1: Verificar la URL de redirección en Supabase

1. Ve a tu dashboard de Supabase
2. Ve a **Authentication → URL Configuration**
3. Verifica que esté configurado:
   - **Site URL:** `https://la-mula-millonaria.vercel.app`
   - **Redirect URLs:** `https://la-mula-millonaria.vercel.app/auth/callback`

### Paso 2: Verificar el flujo de autenticación

El flujo correcto es:

1. Usuario hace clic en "Continuar con Google"
2. Google pide acceso (con el nombre de la app, no el ID del proyecto)
3. Usuario acepta
4. Google redirige a `https://cjmjpjdbfzekcldbdpti.supabase.co/auth/v1/callback`
5. Supabase redirige a `https://la-mula-millonaria.vercel.app/auth/callback`
6. La app procesa el callback y redirige a `/game`

### Paso 3: Verificar el código de AuthCallback

El archivo `src/pages/AuthCallback.tsx` debería procesar el callback correctamente.

---

## Verificación

Después de configurar todo:

1. **Prueba Google OAuth:**
   - Haz clic en "Continuar con Google"
   - Debería mostrar "La Mula Millonaria quiere acceder a tu cuenta" (no el ID del proyecto)

2. **Prueba la redirección:**
   - Después de aceptar, debería redirigir a `/game` (no a `/login`)

---

## Troubleshooting

### Error: "Invalid redirect URI"

**Solución:** Verifica que la redirect URI en Google Cloud Console sea exactamente:
```
https://cjmjpjdbfzekcldbdpti.supabase.co/auth/v1/callback
```

### Error: "Redirect to /login instead of /game"

**Solución:** Verifica que la Site URL en Supabase sea:
```
https://la-mula-millonaria.vercel.app
```

### Error: "Access blocked: This app's request is invalid"

**Solución:** Verifica que la pantalla de consentimiento esté configurada correctamente en Google Cloud Console.

---

## Referencias

- [Supabase Auth - Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)

---

**¿Necesitas ayuda?** Contacta a support@supabase.io o revisa la documentación oficial.
