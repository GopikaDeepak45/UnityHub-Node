import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../middlewares/asyncErrorHandler";
import Community from "../models/community";
import { BadRequestError } from "../errors/BadRequestError";
import User from "../models/user";
import { ConflictError } from "../errors/ConflictError";
import sendEmail from "../utils/sendMail";
import mongoose, { Schema } from "mongoose";
import UnverifiedUser from "../models/unverifiedUser";
import { v2 as cloudinary } from 'cloudinary';
import CommAdmin from "../models/commAdmin";
import { NotFoundError } from "../errors/NotFoundError";
import { ObjectId } from "mongodb";
import UserService from "../models/userServices";

interface Member {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  contactNo: string;
  block: string;
  flatNo: string;
  members: string[];
}
// Define an interface for the populated data
interface PopulatedUser extends Document {
  communityId: {
    name: string;
    hero: {
      url: string;
    };
  };
  profileImg?: {
    url: string;
  };
}

const fetchUsersData=asyncErrorHandler(async (req: Request, res: Response) =>{
 
  const {communityAdminId}=req.query
  const commAdmin = await CommAdmin.findById(communityAdminId);

  if (!commAdmin) {
    throw new NotFoundError('Community Admin not found');
  }
  const users=await User.find({communityId:commAdmin.communityId})
  if(!users){
    throw new NotFoundError('Users data not found');
  }
 
  res.status(200).json(users)
})
const fetchUsersDataByUser=asyncErrorHandler(async (req: Request, res: Response) =>{
 
  const {userId}=req.query
 
  const user=await User.findById(userId)
  if(!user){
    throw new NotFoundError('User data not found')
  }
  const users=await User.find({communityId:user.communityId})
  if(!users){
    throw new NotFoundError('Users data not found');
  }
 
  res.status(200).json(users)
})
const userRegister = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { communityName, location, block, flatNo, fullName, email, password, confirmPassword, contactNo } = req.body

  // const community = await Community.findOne({ name: communityName, location }).populate('members');
  const community = await Community.findOne({
    name: { $regex: new RegExp(communityName, 'i') },
    location: { $regex: new RegExp(location, 'i') }
  }).populate('members');

  if (!community) {
    throw new BadRequestError('Community Not Found')
  }
  // Type assertion to ensure TypeScript understands the populated data
  const members = community.members as unknown as Member[];

  // Find the member with the given flat number and block (case insensitive)
  const flatExists = members.find(member =>
    member.flatNo === flatNo &&
    member.block.toLowerCase() === block.toLowerCase()
  );

  if (!flatExists) {
    throw new BadRequestError('Flat not found in the community.')
  }

  // Check if the user is a member of the flat
  const isFlatMember = flatExists.members.find((member: string) => member.toLowerCase() === req.body.fullName.toLowerCase());

  if (!isFlatMember) {
    throw new BadRequestError('You are not a member of this flat.')
  }
  if (password !== confirmPassword) {
    throw new BadRequestError("Passwords do not match");
  }

  const existingEmail = await User.findOne({ email })
  if (existingEmail) {
    throw new ConflictError('Email already exists');
  }
  const unverifiedUserData = {
    userName: fullName,
    email,
    contactNo,
    communityId: community._id, 
    block,
    flatNo,
    password,
  };
  // Create new unverified user
  const unverifiedUser = new UnverifiedUser(unverifiedUserData);

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const sub = 'Login OTP'
  const msg = `Your OTP for Login : ${otp}`

  //save otp
  unverifiedUser.otp = otp

  await unverifiedUser.save();

  sendEmail(email, sub, msg)

  res.status(200).json({ userId: unverifiedUser._id, message: "Verification mail send successfully" });

})

const verifyOTP = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { pin, id } = req.body

  const unverifiedUser = await UnverifiedUser.findById(id);

  if (unverifiedUser) {

    if (unverifiedUser?.otp === pin) {
      //create new user as its verified

      const newUser = new User({
        userName: unverifiedUser.userName,
        email: unverifiedUser.email,
        contactNo: unverifiedUser.contactNo,
        block: unverifiedUser.block,
        flatNo: unverifiedUser.flatNo,
        password: unverifiedUser.password,
        isVerified: true,
        communityId: unverifiedUser.communityId
      });

      await newUser.save();

      await UnverifiedUser.findByIdAndDelete(id);


    }
    res.status(200).json({ message: 'OTP verified and user created' })
  } else {
    throw new BadRequestError('Invalid OTP')
  }
  console.log('verify otp', req.body)

})
const blockUser=asyncErrorHandler(async(req:Request,res:Response)=>{
  console.log('eneter block user',req.body)
  const{reason,userId,email,communityAdminId}=req.body
  const commAdmin=await CommAdmin.findById(communityAdminId)
  if(!commAdmin){
    throw new NotFoundError('Community admin data not found');
  }
  const user=await User.findById(userId)
  if(!user){
    throw new NotFoundError('User data not found')
  }
  user.isBlocked=true
  user.blockReason=reason
  await user.save()
  res.status(200).json({message:"User Blocked"})

})
const unblockUser=asyncErrorHandler(async(req:Request,res:Response)=>{
  console.log('eneter unblock user',req.query)
  const{userId}=req.query
  const user=await User.findById(userId)
  if(!user){
    throw new NotFoundError('User data not found')
  }
  user.isBlocked=false
  user.blockReason=""
  await user.save()
  res.status(200).json({message:"User unlocked successfully"})
})
const getBasicUserInfo = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.query

  const userInfo = await User.findById(userId)
    .populate({
      path: 'communityId',
      select: 'name hero.url' // Select name and hero.url fields
    })
    .select('profileImg') as unknown as PopulatedUser; // Type assertion

  if (userInfo) {
    const userData = {
      communityName: userInfo.communityId?.name,
      communityImg: userInfo.communityId?.hero?.url,
      profileImg: userInfo.profileImg?.url
    };
    res.status(200).json(userData)
  }
})

const getUserInfo= asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  console.log('entered user info')
  const { userId } = req.query
  const userInfo = await User.findById(userId)

  console.log('getuser info',userInfo)
    res.status(200).json(userInfo)
})
const updateProfile=asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
const {fullName,email,contactNo,imageUrl,publicId,userId}=req.body
let oldPublicId = null;

const user=await User.findById(userId)
if(!user){
  throw new BadRequestError('User not found')
}
// Update user details
user.userName = fullName || user.userName;
user.email = email || user.email;
user.contactNo = contactNo || user.contactNo;
if(user.profileImg?.publicId){
   oldPublicId=user.profileImg.publicId
}
if(imageUrl&&publicId){
  user.profileImg={
    url:imageUrl,
    publicId
  }
}
await user.save()
// Delete old image from Cloudinary if it exists
if (oldPublicId) {
  await cloudinary.uploader.destroy(oldPublicId);
}
 res.status(200).json({message:"Data updated successfully"}) 
})

const changePassword=asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {oldPassword,newPassword,confirmPassword,userId}=req.body
  if (!oldPassword || !newPassword || !confirmPassword || !userId) {
    throw new BadRequestError('Fields are missing')
  }
  const user=await User.findById(userId)
  if(!user){
    throw new BadRequestError('Given user data not exists.')
  }
  user.password=newPassword
  await user.save()
  res.status(200).json({message:'Password changed successfully'})
})

//for connections
const getUserConnections = asyncErrorHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;

  if (!userId) {
    throw new BadRequestError('User ID is required');
  }

  const user = await User.findById(userId).populate('connections connectionRequests.fromUserId');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
 
  res.status(200).json({
    connections: user.connections,
    connectionRequests: user.connectionRequests,
  });
});
const sendConnectionRequest = asyncErrorHandler(async (req: Request, res: Response) => {   
  console.log('enter send connect req');
  const fromId = req.query.fromId?.toString();
  const toId = req.query.toId?.toString();

  if (!fromId || !toId) {
      throw new BadRequestError('fromId and toId are required');
  }

  const fromUser = await User.findById(fromId);
  const toUser = await User.findById(toId);
  

  if (!fromUser || !toUser) {
     throw new NotFoundError('User not found')
  }

  const existingRequest = toUser.connectionRequests.find(
      request => request.fromUserId.toString() === fromId
  );

  if (existingRequest) {
      throw new ConflictError('Connection request already sent');
  }

  const fromUserId = new mongoose.Types.ObjectId(fromId);
  toUser.connectionRequests.push({
      fromUserId: fromUserId,
      status: 'pending',
      sentAt: new Date()
  });

  await fromUser.save();
  await toUser.save();

  res.status(200).json({ message: 'Connection request sent' });
});
const acceptConnectionRequest = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log('enter accept connect req',req.query);
  const fromId = req.query.fromId?.toString();
  const toId = req.query.toId?.toString();

  if (!fromId || !toId) {
      throw new BadRequestError('fromId and toId are required');
  }

  const user = await User.findById(toId);
  if (!user) {
    throw new NotFoundError('User not found')
  }

  const requestIndex = user.connectionRequests.findIndex(
      request => request.fromUserId.toString() === fromId
  );
  
  if (requestIndex === -1) {
      throw new NotFoundError('Connection request not found')  
  }

  user.connectionRequests[requestIndex].status = 'accepted';
  user.connectionRequests[requestIndex].respondedAt = new Date();
  user.connections.push(new mongoose.Types.ObjectId(fromId));

  const fromUser = await User.findById(fromId);
  if (fromUser) {
      fromUser.connections.push(new mongoose.Types.ObjectId(toId));
      fromUser.connectionRequests.push({
        fromUserId: new mongoose.Types.ObjectId(toId),
        status: 'accepted',
        sentAt: new Date()
    })
      await fromUser.save();
  }

  await user.save();

  res.status(200).json({ message: 'Connection request accepted' });
});
const declineConnectionRequest = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log('enter decline connect req');
  const fromId = req.query.fromId?.toString();
  const toId = req.query.toId?.toString();

  if (!fromId || !toId) {
      throw new BadRequestError('fromId and toId are required');
  }

  const toUser = await User.findById(toId);
  if (!toUser) {
    throw new NotFoundError('User not found')
  }

  const requestIndex = toUser.connectionRequests.findIndex(
      request => request.fromUserId.toString() === fromId && request.status === 'pending'
  );

  if (requestIndex === -1) {
    throw new NotFoundError('Connection request not found')
  }

  toUser.connectionRequests[requestIndex].status = 'declined';
  toUser.connectionRequests[requestIndex].respondedAt = new Date();

  await toUser.save();

  res.status(200).json({ message: 'Connection request declined' });
});
//for userservices connection

const sendConnectionRequestForService = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log('enter send connect req service');
  const fromId = req.query.fromId?.toString();
  const toId = req.query.toId?.toString();

  if (!fromId || !toId) {
    throw new BadRequestError('fromId and toId are required');
  }

  const fromUser = await User.findById(fromId);
  const toUser = await User.findById(toId);

  if (!fromUser || !toUser) {
    throw new NotFoundError('User not found');
  }

  const userService = await UserService.findOne({ providerId: toId });

  if (!userService) {
    throw new NotFoundError('Service not found');
  }

  const existingRequestInService = userService.connectionRequests.find(
    (request: { fromUserId: { toString: () => string; }; }) => request.fromUserId.toString() === fromId
  );

  const existingRequestInUser = toUser.connectionRequests.find(
    (request: { fromUserId: { toString: () => string; }; }) => request.fromUserId.toString() === fromId
  );

  if (existingRequestInService || existingRequestInUser) {
    throw new ConflictError('Connection request already sent');
  }

  userService.connectionRequests.push({
    fromUserId: new Schema.Types.ObjectId(fromId),
    status: 'pending',
    sentAt: new Date()
  });

  toUser.connectionRequests.push({
    fromUserId: new mongoose.Types.ObjectId(fromId),
    status: 'pending',
    sentAt: new Date()
  });

  await userService.save();
  await toUser.save();

  res.status(200).json({ message: 'Connection request sent' });
});
const acceptConnectionRequestForService = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log('enter accept connect req',req.query);
  const fromId = req.query.fromId?.toString();
  const toId = req.query.toId?.toString();

  if (!fromId || !toId) {
      throw new BadRequestError('fromId and toId are required');
  }

  const user = await User.findById(toId);
  if (!user) {
    throw new NotFoundError('User not found')
  }

  const requestIndex = user.connectionRequests.findIndex(
      request => request.fromUserId.toString() === fromId
  );
  
  if (requestIndex === -1) {
      throw new NotFoundError('Connection request not found')  
  }

  user.connectionRequests[requestIndex].status = 'accepted';
  user.connectionRequests[requestIndex].respondedAt = new Date();
  user.connections.push(new mongoose.Types.ObjectId(fromId));

  const fromUser = await User.findById(fromId);
  if (fromUser) {
      fromUser.connections.push(new mongoose.Types.ObjectId(toId));
      fromUser.connectionRequests.push({
        fromUserId: new mongoose.Types.ObjectId(toId),
        status: 'accepted',
        sentAt: new Date()
    })
      await fromUser.save();
  }

  await user.save();

  res.status(200).json({ message: 'Connection request accepted' });
});
const declineConnectionRequestForService = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log('enter decline connect req');
  const fromId = req.query.fromId?.toString();
  const toId = req.query.toId?.toString();

  if (!fromId || !toId) {
      throw new BadRequestError('fromId and toId are required');
  }

  const toUser = await User.findById(toId);
  if (!toUser) {
    throw new NotFoundError('User not found')
  }

  const requestIndex = toUser.connectionRequests.findIndex(
      request => request.fromUserId.toString() === fromId && request.status === 'pending'
  );

  if (requestIndex === -1) {
    throw new NotFoundError('Connection request not found')
  }

  toUser.connectionRequests[requestIndex].status = 'declined';
  toUser.connectionRequests[requestIndex].respondedAt = new Date();

  await toUser.save();

  res.status(200).json({ message: 'Connection request declined' });
});


export {
  fetchUsersData,
  userRegister,
  verifyOTP,
  blockUser,
  unblockUser,
  getBasicUserInfo,
  getUserInfo,
  updateProfile,
  changePassword,
  fetchUsersDataByUser,
  getUserConnections,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  sendConnectionRequestForService,
  acceptConnectionRequestForService,
  declineConnectionRequestForService,
}