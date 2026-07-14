import { createRouter, authedQuery } from "./middleware";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  logout: authedQuery.mutation(() => {
    // Frontend handles Clerk sign-out; backend just acknowledges.
    return { success: true };
  }),
});
