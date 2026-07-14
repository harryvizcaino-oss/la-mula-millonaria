import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SignIn routing="hash" signUpUrl="/register" afterSignInUrl="/" />
    </div>
  );
}
