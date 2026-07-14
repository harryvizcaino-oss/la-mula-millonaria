import { SignUp, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function Register() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-pulse text-slate-500">Cargando...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SignUp routing="path" signInUrl="/login" afterSignUpUrl="/" />
    </div>
  );
}
