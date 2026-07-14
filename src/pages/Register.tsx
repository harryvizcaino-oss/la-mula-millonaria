import { SignUp } from "@clerk/clerk-react";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SignUp routing="path" signInUrl="/login" afterSignUpUrl="/" />
    </div>
  );
}
