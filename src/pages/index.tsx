import { type User } from "@prisma/client";
import { type NextPage } from "next";
import { useRouter } from "next/router";
import { CSSProperties, useState } from "react";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { withSessionSsr } from "~/server/session";

import { api, getBaseUrl } from "~/utils/api";
import { formatTime } from "~/utils/formatTime";
import { useHasRendered } from "~/utils/useHasRendered";
import { useInterval } from "~/utils/useInterval";

export const getServerSideProps = withSessionSsr<HomePageProps>(
  async function getServerSideProps({ req }) {
    const {
      session: { user },
    } = req;

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: `${getBaseUrl()}/signin`,
        },
        props: {
          user: null,
          allowTracking: false,
          claimIntervalSeconds: 0,
        },
      };
    }

    const [
      {
        userSettings: {
          allowTracking,
          streak: { claimIntervalSeconds, interactions },
        },
      },
    ] = await Promise.all([
      prisma.user.findFirstOrThrow({
        where: { id: user.id },
        select: {
          userSettings: {
            select: {
              allowTracking: true,
              streak: {
                select: {
                  claimIntervalSeconds: true,
                  interactions: {
                    where: {
                      userId: user.id,
                    },
                    orderBy: {
                      timestamp: "desc",
                    },
                    take: 1,
                    select: {
                      timestamp: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const trpc = appRouter.createCaller({ prisma, session: req.session });
    const rewards = await trpc.rewards.getUserRewards();

    return {
      props: {
        user,
        allowTracking,
        lastInteractionTimestamp: interactions[0]?.timestamp.getTime() ?? 0,
        claimIntervalSeconds,
        rewards,
      },
    };
  }
);

type ClientRewards = Record<
  string,
  {
    readonly count: number;
    readonly title: string;
    readonly description: string;
    readonly imageUrl: string;
  }
>;

type HomePageProps = {
  readonly user: Pick<User, "id"> | null;
  readonly lastInteractionTimestamp: number;
  readonly claimIntervalSeconds: number;
  readonly allowTracking: boolean;
  readonly rewards: ClientRewards;
};

function getRemainingSeconds(targetTime: number): number {
  const elapsedTime = Math.ceil((targetTime - Date.now()) / 1_000);

  return Math.max(0, elapsedTime);
}

function InteractionButton({
  lastInteractionTimestamp: lastInteractionTimestampInitialState,
  allowTracking,
  claimIntervalSeconds,
  onNewReward,
}: Pick<
  HomePageProps,
  "allowTracking" | "lastInteractionTimestamp" | "claimIntervalSeconds"
> & {
  onNewReward: (rewardId: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastInteractionTimestamp, setLastInteractionTimestamp] = useState(
    lastInteractionTimestampInitialState
  );
  const [remainingSeconds, setRemainingSeconds] = useState(
    getRemainingSeconds(lastInteractionTimestamp + claimIntervalSeconds * 1_000)
  );
  const hasRendered = useHasRendered();

  useInterval(() => {
    setRemainingSeconds(
      getRemainingSeconds(
        lastInteractionTimestamp + claimIntervalSeconds * 1_000
      )
    );
  }, 1_000);

  async function interact() {
    setIsLoading(true);
    const response = await fetch("/api/interaction", {
      method: "POST",
    });
    const { timestamp, rewardId } = (await response.json()) as {
      timestamp: number;
      rewardId: string;
    };
    setLastInteractionTimestamp(timestamp);
    setRemainingSeconds(
      getRemainingSeconds(timestamp + claimIntervalSeconds * 1_000)
    );

    if (rewardId) {
      onNewReward(rewardId);
    }

    setIsLoading(false);
  }

  const label = (() => {
    if (!hasRendered) return "Calculating...";
    if (!allowTracking) return "Tracking disabled";
    if (isLoading) return "Loading...";
    if (remainingSeconds === 0) return "Redeem";

    const { hours, minutes, seconds } = formatTime(remainingSeconds);
    return (
      <span className="countdown font-mono text-2xl">
        <span style={{ "--value": hours } as CSSProperties}></span>:
        <span style={{ "--value": minutes } as CSSProperties}></span>:
        <span style={{ "--value": seconds } as CSSProperties}></span>
      </span>
    );
  })();

  return (
    <button
      className="btn-primary btn mb-4 mt-auto h-16 w-10/12 sm:mb-6 sm:w-96 md:mb-8"
      onClick={interact}
      disabled={!allowTracking || remainingSeconds !== 0 || isLoading}
    >
      {label}
    </button>
  );
}

function Rewards({ rewards }: { rewards: ClientRewards }) {
  return (
    <div className="mb-6 flex max-w-full flex-wrap justify-center">
      {Object.values(rewards).map((reward) => (
        <div className="card glass mx-6 mt-8 w-96 sm:mt-16" key={reward.title}>
          <figure>
            <img
              src={reward.imageUrl}
              alt=""
              className="absolute right-0 top-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 sm:h-16 sm:w-16"
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title">{reward.title}</h2>
            <p>{reward.description}</p>
            <div className="badge-primary badge-outline badge badge-lg mt-4 self-end">
              {reward.count}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const Home: NextPage<HomePageProps> = ({
  lastInteractionTimestamp,
  allowTracking: allowTrackingInitialState,
  claimIntervalSeconds: intervalSeconds,
  rewards: initialRewards,
}) => {
  const router = useRouter();
  const [allowTracking, setAllowTracking] = useState(allowTrackingInitialState);
  const updateUserSettings = api.userSettings.update.useMutation();
  const rewards = api.rewards.getUserRewards.useQuery(undefined, {
    initialData: initialRewards,
  });

  async function signOut() {
    await fetch("/api/signOut", {
      method: "POST",
    });
    await router.push("/signin");
  }

  async function handleUpdateAllowTracking() {
    if (updateUserSettings.isLoading) return;

    const result = await updateUserSettings.mutateAsync({
      allowTracking: !allowTracking,
    });
    setAllowTracking(result.allowTracking);
  }

  return (
    <div className="flex h-full flex-col items-center">
      <div className="navbar">
        <a className="text-md btn-ghost btn normal-case sm:text-2xl">Streak</a>

        <div className="ml-auto">
          <div className="form-control mr-1 sm:mr-4">
            <label className="label cursor-pointer text-xs">
              <span className="label-text">Allow tracking</span>
              <input
                type="checkbox"
                className="toggle-success toggle toggle-xs ml-2 sm:toggle-sm"
                checked={allowTracking}
                onChange={handleUpdateAllowTracking}
              />
            </label>
          </div>

          <button
            className="btn-ghost btn-xs btn ml-auto normal-case sm:btn-md"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      </div>

      <Rewards rewards={rewards.data} />

      {/* <main className="flex grow justify-center"> */}
      {/* <div className="container flex h-full flex-col items-center justify-center"> */}
      <InteractionButton
        lastInteractionTimestamp={lastInteractionTimestamp}
        allowTracking={allowTracking}
        claimIntervalSeconds={intervalSeconds}
        onNewReward={() => rewards.refetch()}
      />
      {/* </div> */}
      {/* </main> */}
    </div>
  );
};

export default Home;
