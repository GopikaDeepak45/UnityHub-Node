import { Request, Response } from "express";
import asyncErrorHandler from "../middlewares/asyncErrorHandler";
import CommAdmin from "../models/commAdmin";
import Community from "../models/community";
import { NotFoundError } from "../errors/NotFoundError";
import sendEmail from "../utils/sendMail";
import CommunityMember from "../models/communityMember";
import { ConflictError } from "../errors/ConflictError";
import { BadRequestError } from "../errors/BadRequestError";
import { v2 as cloudinary } from 'cloudinary';
import User from "../models/user";
import mongoose from "mongoose";

interface Member {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  contactNo: string;
  block: string;
  flatNo: string;
}


// Handler function to fetch community data
const fetchCommunitiesData = asyncErrorHandler(async (req: Request, res: Response) => {

  const communityData = await CommAdmin.find().populate('communityId');
if(!communityData){
  throw new NotFoundError('Community Data not found');
}
  res.status(200).json({ communityData });
});
const fetchCommunityData=asyncErrorHandler(async (req: Request, res: Response) =>{
  const {communityAdminId}=req.query
 
  const commAdmin = await CommAdmin.findById(communityAdminId);

  if (!commAdmin) {
    throw new NotFoundError('Community Admin not found');
  }

  // Find the community data using the communityId
  const community = await Community.findById(commAdmin.communityId).populate('members');

  if (!community) {
    throw new NotFoundError('Community not found');
  }
  res.status(200).json(community);
})
const addCommunityImage=asyncErrorHandler(async (req: Request, res: Response) =>{
  console.log('add community image')
  const { imageType, imageUrl, publicId,commId } = req.body;

  const community = await Community.findById(commId);

  if (!community) {
    throw new NotFoundError('Community not found');
  }

  //if already have , delete that
  if(community.hero?.publicId){
    await cloudinary.uploader.destroy(community.hero.publicId)
  }
  // Update the community's hero image
  community.hero = {
      url: imageUrl,
      publicId: publicId
  };

  // Save the updated community
  await community.save();

  res.status(200).json({ message: 'Community image added successfully'});
})

const deleteCommunityImage=asyncErrorHandler(async (req: Request, res: Response) =>{
  console.log('entered delete comm img',req.body)
  const { imageType, imageUrl, publicId,commId } = req.body;

  const community = await Community.findById(commId);

  if (!community) {
    throw new NotFoundError('Community not found');
  }

  if (imageType === 'hero' && community.hero?.url === imageUrl && community.hero?.publicId === publicId) {
    // Perform the deletion
    community.hero = null; // Assuming you want to clear the hero image

    // Save the updated community
    await community.save();

    return res.status(200).json({ message: 'Community image deleted successfully'})
  }
})
  
const addCommunityMember = asyncErrorHandler(async (req: Request, res: Response) => {
  const { commAdminId, fullName, email, contactNo,block, flatNo, members } = req.body;
  // Transform members array from [{ member: "name" }] to ["name"]
  const memberNames = members.map((m: { member: string }) => m.member);
console.log('entered add member')

const commAdmin = await CommAdmin.findById(commAdminId);

  if (!commAdmin) {
    throw new NotFoundError('Community admin not found');
  }
  const community = await Community.findById(commAdmin.communityId).populate('members')
  if (!community) {
    throw new NotFoundError('Community not found');
  }

// Type assertion to ensure TypeScript understands the populated data
const membersArray = community.members as unknown as Member[];

  // Check if flat number already exists in the community
  const flatExists = membersArray.some((member:Member) => member.flatNo=== flatNo && member.block.toLowerCase()===block.toLowerCase());

  if (flatExists) {
    throw new ConflictError('Block and Flat number already exists in this community ');
  }
  const newMember = await CommunityMember.create({
    fullName,
    email,
    contactNo,
    block,
    flatNo,
    members:[...memberNames,fullName]
  });


  community.members.push(newMember._id)
  await community.save()

  res.status(200).json({ message: "Added Successfully" });
})
const editCommunityMember = asyncErrorHandler(async (req: Request, res: Response) => {
  const { _id:memberId, fullName, email, contactNo, flatNo, members } = req.body;
  
  // Transform members array from [{ member: "name" }] to ["name"]
  const memberNames = members.map((m: { member: string }) => m.member);

  const member = await CommunityMember.findById(memberId);
  
  if (!member) {
    throw new NotFoundError('Member not found');
  }

  // Update member details
  member.userName = fullName;
  member.email = email;
  member.contactNo = contactNo;
  member.flatNo = flatNo;
  member.members = memberNames;

  await member.save();

  res.status(200).json({ message: "Updated Successfully" });
});
const deleteCommunityMember = asyncErrorHandler(async (req: Request, res: Response) => {
  const { memberId, commAdminId } = req.query;
  console.log('entered delete member',req.query);

  const commAdmin = await CommAdmin.findById(commAdminId);

  if (!commAdmin) {
    throw new NotFoundError('Community admin not found');
  }

  const community = await Community.findById(commAdmin.communityId).populate('members');
  if (!community) {
    throw new NotFoundError('Community not found');
  }
// Type assertion to ensure TypeScript understands the populated data
const membersArray = community.members as unknown as Member[];

  const memberIndex = membersArray.findIndex((member: Member) => member._id.toString() === memberId);

  if (memberIndex === -1) {
    throw new NotFoundError('Data not found in community');
  }

  

  // Find all users with the same flatNo
  const member = await CommunityMember.findById(memberId);
  if (!member) {
    throw new NotFoundError('Member not found in CommunityMember collection');
  }

  const users = await User.find({ flatNo: member.flatNo });

  // Block each user
  for (const user of users) {
    user.isBlocked = true;
    user.blockReason = 'Community Admin deleted your data';
    await user.save();
  }
// Remove member from community
community.members.splice(memberIndex, 1);
await community.save();
  // Delete member
  await CommunityMember.findByIdAndDelete(memberId);

  res.status(200).json({ message: "Deleted Successfully" });
});
const messageToCommunityAdmin = asyncErrorHandler(async (req: Request, res: Response) => {
 
  const { message, email } = req.body
  const to = email
  const sub = `Email from UnityHub`
  const msg = message
  sendEmail(to, sub, msg)

  res.status(200).json({ message: "Message sent successfully" });
})

const blockCommunity = asyncErrorHandler(async (req: Request, res: Response) => {
  const { reason, communityId, email } = req.body
 
  const community = await Community.findById(communityId)

  if (!community) {
    throw new NotFoundError('Community not found');
  }

  community.isBlocked = true
  community.blockReason = reason

  await community.save()
  const to = email
  const sub = `Email from UnityHub`
  const msg = `Admin blocked your community ${community.name}. ${reason}`
  sendEmail(to, sub, msg)

  res.status(200).json({ message: "ok" });
})

const unblockCommunity = asyncErrorHandler(async (req: Request, res: Response) => {
  const { communityId } = req.query

  const community = await Community.findById(communityId);

  if (!community) {
    throw new NotFoundError('Community not found');
  }

  // Update community properties
  community.isBlocked = false;
  community.blockReason = "";

  // Save the updated community
  await community.save();

  res.status(200).json({ message: "Community unblocked successfully" });
})
export {
  fetchCommunitiesData,
  fetchCommunityData,
  messageToCommunityAdmin,
  blockCommunity,
  unblockCommunity,
  addCommunityMember,
  editCommunityMember,
  deleteCommunityMember,
  addCommunityImage,
  deleteCommunityImage,
 
};
