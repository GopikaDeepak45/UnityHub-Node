import { Request, Response, NextFunction } from "express";
import User from "../models/user";
import { ForbiddenError } from "../errors/ForbiddenError";
import { AuthenticationError } from "../errors/AuthenticationError";
import { BadRequestError } from "../errors/BadRequestError";
import asyncErrorHandler from "./asyncErrorHandler";
import { BlockedError } from "../errors/BlockedError";
import Community from "../models/community";
import { NotFoundError } from "../errors/NotFoundError";

interface CustomRequest extends Request {
  user?: {
    username: string;
    userId: string;
    role: string;
  };
}
const checkUserBlockedStatus = asyncErrorHandler(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    let userId = req.user?.userId;

    // const userId = req.body.userId || req.query.userId || req.params.userId;
    if (!userId) {
      throw new BadRequestError("User id is required");
    }

    const foundUser = await User.findById(userId)
      .populate("communityId")
      .exec();
    if (!foundUser) {
      throw new AuthenticationError();
    }
    const communityId = foundUser?.communityId;
    const community = await Community.findById(communityId);
    if (!community) {
      console.log('community not found malu')
      throw new NotFoundError("Your Community data not found");
    }

    if (community.isBlocked) {
      throw new BlockedError(
        `Your community ${community.name} is blocked. You cannot proceed.`
      );
    }

    if (foundUser.isBlocked) {
      throw new BlockedError("Your account is blocked. You cannot proceed.");
    }

    next();
  }
);

export default checkUserBlockedStatus;
