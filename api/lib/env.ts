import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  clerkPublishableKey: required("VITE_CLERK_PUBLISHABLE_KEY"),
  clerkSecretKey: required("CLERK_SECRET_KEY"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  ownerClerkId: process.env.OWNER_CLERK_ID ?? "",
};
