import { createClerkClient } from "@clerk/backend";
import { env } from "../lib/env";
import { findUserByUnionId, upsertUser } from "../queries/users";
import type { User } from "@db/schema";

const clerk = createClerkClient({ secretKey: env.clerkSecretKey });

// Local development user used when no Clerk session is present and the app
// is not running in production. This lets the game work out of the box
// without an external auth server.
const LOCAL_DEV_USER: User = {
  id: 0,
  unionId: "local-dev-user",
  name: "Jugador Local",
  email: "local@example.com",
  avatar: null,
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

export async function authenticateRequest(headers: Headers): Promise<User> {
  const token = headers.get("authorization")?.replace("Bearer ", "") ?? "";

  if (!token) {
    if (!env.isProduction) {
      return LOCAL_DEV_USER;
    }
    throw new Error("Missing authentication token");
  }

  try {
    const { sub: clerkUserId } = await clerk.verifyToken(token);
    if (!clerkUserId) {
      throw new Error("Invalid Clerk token");
    }

    let user = await findUserByUnionId(clerkUserId);

    if (!user) {
      const clerkUser = await clerk.users.getUser(clerkUserId);
      await upsertUser({
        unionId: clerkUserId,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
          : (clerkUser.username ?? "Jugador"),
        email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
        avatar: clerkUser.imageUrl ?? null,
        lastSignInAt: new Date(),
      });
      user = await findUserByUnionId(clerkUserId);
    }

    if (!user) {
      throw new Error("Failed to create or find user");
    }

    return user;
  } catch (error) {
    console.error("[clerk/auth] Authentication failed:", error);
    if (!env.isProduction) {
      return LOCAL_DEV_USER;
    }
    throw new Error("Invalid authentication token");
  }
}
