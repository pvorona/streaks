import { Reward } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ensureDefined } from "~/utils/ensureDefined";

export const rewardsRouter = createTRPCRouter({
  getUserRewards: protectedProcedure.query(async ({ ctx }) => {
    const [userRewardCounts, rewards] = await Promise.all([
      ctx.prisma.userReward.groupBy({
        where: { userId: ctx.session.user.id },
        _count: true,
        by: ["rewardId"],
      }),
      ctx.prisma.reward.findMany(),
    ]);

    const rewardById: Record<string, Reward> = {};
    for (const reward of rewards) {
      rewardById[reward.id] = reward;
    }

    const clientRewards: Record<
      string,
      { count: number } & Pick<Reward, "description" | "title" | "imageUrl">
    > = {};
    for (const { _count, rewardId } of userRewardCounts) {
      clientRewards[rewardId] = {
        count: _count,
        title: ensureDefined(rewardById[rewardId]).title,
        description: ensureDefined(rewardById[rewardId]).description,
        imageUrl: ensureDefined(rewardById[rewardId]).imageUrl,
      };
    }

    return clientRewards;
  }),
});
