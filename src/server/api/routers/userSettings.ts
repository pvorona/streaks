import { boolean, object } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userSettingsRouter = createTRPCRouter({
  update: protectedProcedure
    .input(
      object({
        allowTracking: boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userSettings } = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          userSettings: {
            update: { allowTracking: input.allowTracking },
          },
        },
        select: {
          userSettings: {
            select: {
              allowTracking: true,
            },
          },
        },
      });

      return userSettings;
    }),
});
