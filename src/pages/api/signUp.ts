import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "~/server/db";
import { withSessionRoute } from "~/server/session";
import { hash } from "bcrypt";

export default withSessionRoute(signUp);

async function signUp(
  req: NextApiRequest,
  res: NextApiResponse<void | string>
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const { email, password, allowTracking } = JSON.parse(req.body) as {
    email: string;
    password: string;
    allowTracking: boolean;
  };

  try {
    const streak = await prisma.streak.findFirstOrThrow();
    const user = await prisma.user.create({
      data: {
        email,
        password: await hash(password, 10),
        userSettings: {
          create: {
            allowTracking,
            streakId: streak.id,
          },
        },
      },
    });
    req.session.user = {
      id: user.id,
    };
    await req.session.save();
    res.send();
  } catch (e) {
    res.status(400).send("User with this email already exists");
  }
}
