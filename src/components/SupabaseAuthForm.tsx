import { useState } from "react";
import { signInWithGoogle, signInWithApple } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.86-3.08.41-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.41C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.98-.2 1.92-.86 3.24-.77 1.58.13 2.77.75 3.55 1.9-3.27 1.96-2.5 6.27.53 7.5-.6 1.57-1.37 3.13-2.4 4.54zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

/**
 * Card de autenticación con OAuth de Supabase (Google / Apple).
 * Reemplaza los widgets `<SignIn>`/`<SignUp>` de Clerk.
 */
export default function SupabaseAuthForm({ mode }: { mode: "login" | "register" }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"google" | "apple" | null>(null);

  const handle = async (provider: "google" | "apple") => {
    setError(null);
    setPending(provider);
    const fn = provider === "google" ? signInWithGoogle : signInWithApple;
    const { error: oauthError } = await fn();
    // Con redirect OAuth el navegador sale de la página; solo importa el error.
    if (oauthError) {
      setError(oauthError.message);
      setPending(null);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-slate-100">
      <h1 className="font-fredoka font-black text-2xl text-slate-900 text-center">
        La Mula Millonaria
      </h1>
      <p className="mt-1 mb-6 text-center text-sm text-slate-500">
        {mode === "login" ? "Inicia sesión para guardar tu progreso" : "Crea tu cuenta para empezar"}
      </p>

      {!isSupabaseConfigured && (
        <p className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 text-center">
          Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!isSupabaseConfigured || pending !== null}
          onClick={() => handle("google")}
          className="h-11 px-4 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <GoogleIcon />
          {pending === "google" ? "Redirigiendo..." : "Continuar con Google"}
        </button>
        <button
          type="button"
          disabled={!isSupabaseConfigured || pending !== null}
          onClick={() => handle("apple")}
          className="h-11 px-4 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <AppleIcon />
          {pending === "apple" ? "Redirigiendo..." : "Continuar con Apple"}
        </button>
      </div>

      {error && <p className="mt-4 text-center text-xs text-red-600">{error}</p>}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
        Al continuar aceptas los términos y la política de privacidad.
      </p>
    </div>
  );
}
