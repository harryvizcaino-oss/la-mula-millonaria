import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SupabaseAuthForm from "@/components/SupabaseAuthForm";

export default function Login() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/game', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-pulse text-slate-500">Cargando...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-slate-700 text-center">Ya iniciaste sesión.</p>
        <button
          type="button"
          onClick={() => navigate('/game')}
          className="h-11 px-6 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white font-fredoka font-black text-sm shadow-md"
        >
          Ir al juego
        </button>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-slate-500 text-sm underline"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SupabaseAuthForm mode="login" />
    </div>
  );
}
