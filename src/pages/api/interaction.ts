import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "~/server/db";
import { withSessionRoute } from "~/server/session";
import { ensureDefined } from "~/utils/ensureDefined";

export default withSessionRoute(interaction);

async function interaction(
  req: NextApiRequest,
  res: NextApiResponse<
    void | string | { timestamp: number; rewardId: string | null }
  >
) {
  const {
    session: { user },
  } = req;

  if (!user) {
    return res.status(401).send();
  }

  const userFromDB = await prisma.user.findFirstOrThrow({
    where: {
      id: user.id,
    },
    include: {
      userSettings: {
        select: {
          allowTracking: true,
          streak: {
            include: {
              interactions: {
                where: {
                  userId: user.id,
                },
                take: 1,
                orderBy: {
                  timestamp: "desc",
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userFromDB.userSettings.allowTracking) {
    return res
      .status(400)
      .send("Tracking should be enabled to perform interaction");
  }

  const now = new Date();
  const nowSeconds = now.getTime() / 1000;
  const lastInteractionSeconds =
    userFromDB.userSettings.streak.interactions.length === 0
      ? -Infinity
      : ensureDefined(
          userFromDB.userSettings.streak.interactions[0]
        ).timestamp.getTime() / 1000;

  if (
    nowSeconds - lastInteractionSeconds <
    userFromDB.userSettings.streak.claimIntervalSeconds
  ) {
    return res
      .status(400)
      .send("Not enough time elapsed since last interaction");
  }

  const serialNumber =
    nowSeconds - lastInteractionSeconds >
    userFromDB.userSettings.streak.backoffSeconds + userFromDB.userSettings.streak.claimIntervalSeconds
      ? 1
      : ensureDefined(userFromDB.userSettings.streak.interactions[0])
          .serialNumber + 1;

  const interaction = await prisma.interaction.create({
    data: {
      userId: user.id,
      streakId: userFromDB.userSettings.streak.id,
      timestamp: now,
      serialNumber,
    },
    select: {
      timestamp: true,
    },
  });

  let rewardId = null;
  if (serialNumber >= userFromDB.userSettings.streak.minInteractions) {
    rewardId = userFromDB.userSettings.streak.rewardId;
    await prisma.userReward.create({
      data: {
        userId: user.id,
        rewardId: userFromDB.userSettings.streak.rewardId,
      },
    });
  }

  return res.send({ timestamp: interaction.timestamp.getTime(), rewardId });
}
