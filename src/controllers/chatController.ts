
import { Request, Response, NextFunction } from 'express';
import asyncErrorHandler from '../middlewares/asyncErrorHandler';
import mongoose from 'mongoose';
import Message from '../models/message';
import { BadRequestError } from '../errors/BadRequestError';

export const fetchChatHistory = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { fromUserId, toUserId } = req.params;

 
  if (!mongoose.Types.ObjectId.isValid(fromUserId) || !mongoose.Types.ObjectId.isValid(toUserId)) {
    throw new BadRequestError('Invalid user ID')
  }

  const fromUserObjectId = new mongoose.Types.ObjectId(fromUserId);
  const toUserObjectId = new mongoose.Types.ObjectId(toUserId);


 // when fetch from user a-b and also from b-a ,so or and 2 cases
  const messages = await Message.find({
    $or: [
      { fromUserId: fromUserObjectId, toUserId: toUserObjectId },   
      { fromUserId: toUserObjectId, toUserId: fromUserObjectId }   
    ]
  }).sort({ timestamp: 1 }); // Sort by timestamp ascending (oldest first)

  console.log(messages);

  // if no msg empty array so no problem in frontend
  return res.status(200).json(messages || []);
});


export const fetchGroupChatHistory = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { groupId } = req.params;
console.log('enter fetch group chat',req.params)

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new BadRequestError('Invalid group ID');
  }

  const groupObjectId = new mongoose.Types.ObjectId(groupId);

  console.log('Fetching group chat history for:', { groupId });


  const messages = await Message.find({ groupId: groupObjectId }).sort({ timestamp: 1 }); // Sort by timestamp ascending

  console.log(messages);

  // if no msg empty array so no problem in frontend
  return res.status(200).json(messages || []);
});