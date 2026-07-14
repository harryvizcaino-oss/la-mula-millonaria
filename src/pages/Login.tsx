import { SignIn, useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-pulse text-slate-500">Cargando...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-slate-700 text-center">Ya iniciaste sesión.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="h-11 px-6 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white font-fredoka font-black text-sm shadow-md"
        >
          Ir al juego
        </button>
        <button
          type="button"
          onClick={() => signOut(() => navigate('/login'))}
          className="text-slate-500 text-sm underline"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SignIn routing="path" signUpUrl="/register" afterSignInUrl="/" />
    </div>
  );
}
