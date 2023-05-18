import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "~/server/db";
import { withSessionRoute } from "~/server/session";
import { compare } from "bcrypt";

export default withSessionRoute(signIn);

async function signIn(req: NextApiRequest, res: NextApiResponse<void>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const { email, password } = JSON.parse(req.body) as {
    email: string;
    password: string;
  };

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(401).send();
    }

    if (!(await compare(password, user.password))) {
      return res.status(401).send();
    }

    req.session.user = {
      id: user.id,
    };
    await req.session.save();
    res.send();
  } catch (error) {
    console.error(error);
    return res.status(401).send();
  }
}
