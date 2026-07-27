# Guía Paso a Paso: Habilitar Google y Apple en Supabase Auth

**Para:** Harry Vizcaíno (Product Owner)
**Proyecto:** La Mula Millonaria
**Fecha:** 27 de julio de 2026

---

## Paso 1: Acceder al Dashboard de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto **La Mula Millonaria** (project ID: `cjmjpjdbfzekcldbdpti`)

---

## Paso 2: Habilitar Google

1. En el menú lateral, ve a **Authentication**
2. Haz clic en **Providers**
3. Busca **Google** en la lista
4. Activa el toggle **Enable Google provider**
5. Configura:
   - **Client ID:** [Obtener de Google Cloud Console]
   - **Client Secret:** [Obtener de Google Cloud Console]
6. Haz clic en **Save**

### ¿Cómo obtener Client ID y Client Secret de Google?

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services → Credentials**
4. Haz clic en **Create Credentials → OAuth 2.0 Client ID**
5. Configura:
   - **Application type:** Web application
   - **Name:** La Mula Millonaria
   - **Authorized JavaScript origins:** `https://cjmjpjdbfzekcldbdpti.supabase.co`
   - **Authorized redirect URIs:** `https://cjmjpjdbfzekcldbdpti.supabase.co/auth/v1/callback`
6. Copia el **Client ID** y **Client Secret**
7. Pégalos en Supabase

---

## Paso 3: Habilitar Apple

1. En el menú lateral, ve a **Authentication**
2. Haz clic en **Providers**
3. Busca **Apple** en la lista
4. Activa el toggle **Enable Apple provider**
5. Configura:
   - **Service ID:** [Obtener de Apple Developer]
   - **Team ID:** [Obtener de Apple Developer]
   - **Key ID:** [Obtener de Apple Developer]
   - **Private Key:** [Obtener de Apple Developer]
6. Haz clic en **Save**

### ¿Cómo obtener Service ID, Team ID, Key ID y Private Key de Apple?

1. Ve a [Apple Developer](https://developer.apple.com)
2. Inicia sesión con tu cuenta de Apple Developer
3. Ve a **Certificates, Identifiers & Profiles**
4. Haz clic en **Identifiers**
5. Haz clic en **+** para crear un nuevo identifier
6. Selecciona **Services IDs** y haz clic en **Continue**
7. Configura:
   - **Description:** La Mula Millonaria
   - **Identifier:** `com.lamulamillonaria.auth`
8. Haz clic en **Continue** y luego **Register**
9. Selecciona el identifier que acabas de crear
10. Activa **Sign In with Apple**
11. Configura:
    - **Primary App ID:** [Selecciona tu App ID]
    - **Website URLs:** `https://cjmjpjdbfzekcldbdpti.supabase.co`
    - **Return URLs:** `https://cjmjpjdbfzekcldbdpti.supabase.co/auth/v1/callback`
12. Haz clic en **Save**
13. Ve a **Keys**
14. Haz clic en **+** para crear una nueva key
15. Configura:
    - **Key Name:** La Mula Millonaria Auth Key
    - **Enable:** Sign In with Apple
16. Haz clic en **Continue** y luego **Register**
17. Descarga la **Private Key** (solo se puede descargar una vez)
18. Copia el **Key ID**
19. Ve a **Membership** para obtener tu **Team ID**

---

## Paso 4: Verificar

1. Ve a **Authentication → Providers**
2. Verifica que **Google** y **Apple** estén habilitados (toggle verde)
3. Prueba el login en la app

---

## Troubleshooting

### Error: "Invalid redirect URI"

**Solución:** Verifica que la redirect URI en Google/Apple sea exactamente:
```
https://cjmjpjdbfzekcldbdpti.supabase.co/auth/v1/callback
```

### Error: "Provider not enabled"

**Solución:** Verifica que el toggle del provider esté activado en Supabase.

### Error: "Invalid client ID"

**Solución:** Verifica que el Client ID sea correcto y que esté habilitado en Google/Apple.

---

## Referencias

- [Supabase Auth - Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth - Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Google Cloud Console](https://console.cloud.google.com)
- [Apple Developer](https://developer.apple.com)

---

**¿Necesitas ayuda?** Contacta a support@supabase.io o revisa la documentación oficial.
