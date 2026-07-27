# Configuración de MFA (Multi-Factor Authentication) — Supabase

**ISO 27001 A.9.4**

Última actualización: 27 de julio de 2026

---

## ¿Qué es MFA?

MFA (Multi-Factor Authentication) agrega una capa extra de seguridad requiriendo dos o más factores de autenticación:
1. **Algo que sabes** (contraseña)
2. **Algo que tienes** (teléfono con app de autenticación)
3. **Algo que eres** (huella digital, cara — no disponible en Supabase Auth)

Supabase Auth soporta **TOTP (Time-based One-Time Password)** con apps como:
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password

---

## Habilitar MFA en Supabase

### Paso 1: Habilitar MFA en el Dashboard

1. Ve a tu dashboard de Supabase
2. **Authentication → Settings → Multi-Factor Authentication**
3. Activa **Enable TOTP**
4. Configura:
   - **Issuer:** La Mula Millonaria
   - **Access Token Expiry:** 3600 (1 hora)
   - **Refresh Token Expiry:** 2592000 (30 días)

### Paso 2: Implementar MFA en la App

#### 2.1 Enroll (Registrar) MFA

```typescript
import { supabase } from '@/lib/supabase';

async function enrollMFA() {
  // 1. Generar QR code para el usuario
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  });

  if (error) {
    console.error('Error enrolling MFA:', error);
    return null;
  }

  // 2. Mostrar QR code al usuario
  // data.totp.qr_code contiene la URL del QR code
  // data.totp.secret contiene el secreto (para ingresar manualmente)
  return data;
}
```

#### 2.2 Verificar MFA

```typescript
async function verifyMFA(factorId: string, code: string) {
  // 1. Crear challenge
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });

  if (challengeError) {
    console.error('Error creating challenge:', challengeError);
    return false;
  }

  // 2. Verificar código
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (error) {
    console.error('Error verifying MFA:', error);
    return false;
  }

  return true;
}
```

#### 2.3 Login con MFA

```typescript
async function loginWithMFA(email: string, password: string) {
  // 1. Login normal
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error logging in:', error);
    return null;
  }

  // 2. Verificar si el usuario tiene MFA habilitado
  if (data.user?.factors && data.user.factors.length > 0) {
    // 3. Pedir código MFA
    const factorId = data.user.factors[0].id;
    const code = prompt('Ingresa tu código MFA:');

    if (!code) return null;

    // 4. Verificar MFA
    const verified = await verifyMFA(factorId, code);
    if (!verified) {
      console.error('Invalid MFA code');
      return null;
    }
  }

  return data;
}
```

#### 2.4 Unenroll (Desactivar) MFA

```typescript
async function unenrollMFA(factorId: string) {
  const { error } = await supabase.auth.mfa.unenroll({
    factorId,
  });

  if (error) {
    console.error('Error unenrolling MFA:', error);
    return false;
  }

  return true;
}
```

---

## Flujo Completo de MFA

### 1. Registro de MFA (Primera Vez)

```
Usuario → Configuración → Seguridad → Habilitar MFA
  ↓
App genera QR code (supabase.auth.mfa.enroll)
  ↓
Usuario escanea QR code con app de autenticación
  ↓
Usuario ingresa código de verificación
  ↓
App verifica código (supabase.auth.mfa.verify)
  ↓
MFA habilitado
```

### 2. Login con MFA

```
Usuario → Login → Email + Contraseña
  ↓
App verifica credenciales (supabase.auth.signInWithPassword)
  ↓
App detecta que el usuario tiene MFA habilitado
  ↓
App pide código MFA
  ↓
Usuario ingresa código de app de autenticación
  ↓
App verifica código (supabase.auth.mfa.challenge + verify)
  ↓
Login exitoso
```

---

## Política de MFA

### ¿Quién debe usar MFA?

**Obligatorio:**
- Cuentas de administrador (Responsable de Seguridad, Equipo Técnico, Responsable Legal)
- Cuentas con acceso a datos sensibles (transacciones, pagos)

**Opcional:**
- Usuarios regulares (recomendado pero no obligatorio)

### ¿Cuándo pedir MFA?

**Siempre:**
- Login desde nuevo dispositivo
- Cambios de configuración de seguridad (email, contraseña, MFA)
- Acceso a datos sensibles (exportar datos, eliminar cuenta)

**Opcional:**
- Cada login (más seguro pero más fricción)
- Solo en acciones sensibles (más usabilidad)

---

## Implementación en la App

### Componente de Configuración de MFA

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function MFASettings() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);

  const handleEnroll = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      console.error('Error enrolling MFA:', error);
      return;
    }

    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
  };

  const handleVerify = async () => {
    if (!factorId) return;

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      console.error('Error creating challenge:', challengeError);
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (error) {
      console.error('Error verifying MFA:', error);
      return;
    }

    // MFA habilitado exitosamente
    alert('MFA habilitado exitosamente');
  };

  return (
    <div>
      <h2>Configurar MFA</h2>
      {!qrCode ? (
        <button onClick={handleEnroll}>Habilitar MFA</button>
      ) : (
        <div>
          <img src={qrCode} alt="QR Code" />
          <p>O ingresa este código manualmente: {secret}</p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de 6 dígitos"
          />
          <button onClick={handleVerify}>Verificar</button>
        </div>
      )}
    </div>
  );
}
```

---

## Próximos Pasos

1. **Habilitar MFA en Supabase Dashboard** (Authentication → Settings → MFA)
2. **Implementar componente de configuración de MFA** en la app
3. **Implementar flujo de login con MFA** en la app
4. **Documentar política de MFA** (quién debe usar, cuándo pedir)
5. **Capacitar a usuarios** (cómo habilitar MFA, cómo usar app de autenticación)

---

## Referencias

- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447)
