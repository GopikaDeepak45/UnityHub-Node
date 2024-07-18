import { Request, Response, NextFunction } from "express";
import { AuthenticationError } from "../errors/AuthenticationError";
import { BadRequestError } from "../errors/BadRequestError";
import asyncErrorHandler from "./asyncErrorHandler";
import CommAdmin from "../models/commAdmin";
import Community from "../models/community";
import { BlockedError } from "../errors/BlockedError";

interface CustomRequest extends Request {
  user?: {
    username: string;
    userId: string;
    role: string;
  };
}
const checkCommunityAdminBlockedStatus = asyncErrorHandler(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    // const commAdminId = req.body.commAdminId || req.body.commId || req.body.communityAdminId ||
    //                     req.query.commAdminId || req.query.commId || req.query.communityAdminId ||
    //                     req.params.commAdminId || req.params.commId || req.params.communityAdminId;
    let commAdminId;
    if (req.user) {
      commAdminId = req.user.userId;
    }

    if (!commAdminId) {
      throw new BadRequestError("Community admin id is required");
    }

    const foundCommunityAdmin = await CommAdmin.findById(commAdminId).exec();

    if (!foundCommunityAdmin) {
      throw new AuthenticationError();
    }
    const foundCommunity = await Community.findById(
      foundCommunityAdmin?.communityId
    ).exec();

    if (!foundCommunity) {
      throw new AuthenticationError();
    }
    if (foundCommunity.isBlocked) {
      throw new BlockedError(
        `Your community ${foundCommunity.name} is blocked. You cannot proceed.`
      );
    }

    // Proceed if community admin is not blocked
    next();
  }
);

export default checkCommunityAdminBlockedStatus;
