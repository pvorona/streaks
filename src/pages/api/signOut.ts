import { type NextApiRequest, type NextApiResponse } from "next";
import { withSessionRoute } from "~/server/session";

export default withSessionRoute(function signOut(
  req: NextApiRequest,
  res: NextApiResponse<void>
) {
  req.session.destroy();
  res.send();
});
