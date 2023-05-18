import { type User } from "@prisma/client";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import {
  type GetServerSidePropsContext,
  type GetServerSidePropsResult,
  type NextApiHandler,
} from "next";
import { ensureString } from "~/utils/ensureString";

declare module "iron-session" {
  interface IronSessionData {
    user?: Pick<User, "id">;
  }
}

export const sessionOptions = {
  cookieName: "x-session",
  password: ensureString(process.env.AUTH_SECRET),
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export function withSessionSsr<
  P extends { [key: string]: unknown } = { [key: string]: unknown }
>(
  handler: (
    context: GetServerSidePropsContext
  ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
) {
  return withIronSessionSsr(handler, sessionOptions);
}
