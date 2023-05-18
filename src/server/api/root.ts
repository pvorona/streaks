import { createTRPCRouter } from "~/server/api/trpc";
import { userSettingsRouter } from "~/server/api/routers/userSettings";
import { rewardsRouter } from "./routers/rewardsRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  userSettings: userSettingsRouter,
  rewards: rewardsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
