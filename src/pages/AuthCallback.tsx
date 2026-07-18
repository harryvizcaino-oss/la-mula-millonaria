import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Destino del redirect OAuth (Google/Apple). El cliente de Supabase
 * intercambia automáticamente el `code` de la URL por una sesión
 * (detectSessionInUrl); aquí solo esperamos la sesión y redirigimos.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  // Error devuelto por el provider en el hash/query (#error=...)
  const [error] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return (
      params.get("error_description") ??
      hashParams.get("error_description") ??
      params.get("error") ??
      hashParams.get("error")
    );
  });

  useEffect(() => {
    if (!isSupabaseConfigured || error) {
      navigate("/login", { replace: true });
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/game", { replace: true });
      }
    });

    // Por si la sesión ya quedó establecida antes de montar el listener.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/game", { replace: true });
    });

    // Fallback: si en 10s no hay sesión, volver al login.
    const timeout = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-3">
      {error ? (
        <>
          <p className="text-slate-700 text-center">No se pudo iniciar sesión.</p>
          <p className="text-slate-500 text-sm text-center">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="h-11 px-6 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white font-fredoka font-black text-sm shadow-md"
          >
            Volver al login
          </button>
        </>
      ) : (
        <>
          <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Iniciando sesión...</p>
        </>
      )}
    </div>
  );
}
