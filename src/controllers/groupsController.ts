import { Request, Response } from "express";
import asyncErrorHandler from "../middlewares/asyncErrorHandler";
import CommAdmin from "../models/commAdmin";
import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import Community from "../models/community";
import { ConflictError } from "../errors/ConflictError";
import { v2 as cloudinary } from 'cloudinary';
import Group from "../models/group";
import User from "../models/user";
import mongoose from "mongoose";

const fetchGroupsData=asyncErrorHandler(async (req: Request, res: Response) =>{
    
    const {communityAdminId}=req.query
    
     const commAdmin = await CommAdmin.findById(communityAdminId);
   
     if (!commAdmin) {
       throw new NotFoundError('Community Admin not found');
     }
   
   
     const groups = await Group.find({communityId:commAdmin.communityId})
   
     if (!groups) {
       throw new NotFoundError('Group not found')
     }
     if (!groups || groups.length === 0) {
  
      return res.status(200).json([]);
    }
   
  
    res.status(200).json(groups);
   })
   const fetchGroupsDataUser=asyncErrorHandler(async (req: Request, res: Response) =>{
    
    const {userId}=req.query
    
     const user = await User.findById(userId);
   
     if (!user) {
       throw new NotFoundError('User data not found');
     }
   
   
     const groups = await Group.find({communityId:user.communityId})
   
     if (!groups) {
       throw new NotFoundError('Group not found')
     }
     if (!groups || groups.length === 0) {
   
      return res.status(200).json([]);
    }
   
  
    res.status(200).json(groups);
   })
   const fetchGroupMembersData=asyncErrorHandler(async (req: Request, res: Response) =>{
    
    const {userId,groupId}=req.query
    
     const user = await User.findById(userId);
   
     if (!user) {
       throw new NotFoundError('User data not found');
     }
   

        
     const group= await Group.findById(groupId).populate({
      path: 'members'
    });
    if (!group) {
      throw new NotFoundError('Group not found')
    }
    const groupMembers=group.members
   

    res.status(200).json(groupMembers);
   })
const addGroupsData= asyncErrorHandler(async (req: Request, res: Response) =>{
  const {name,imageUrl,publicId,shortDescription,commAdminId}=req.body
  

  const commAdmin=await CommAdmin.findById(commAdminId)
  if(!commAdmin){
    throw new NotFoundError('Community admin not found with given id')
  }

  const existingGroup=await Group.findOne({name:{ $regex: new RegExp(`^${name}$`, 'i') }})
  if(existingGroup){
    throw new ConflictError('Group name already exists')
  }
  const data={
    name,
    communityId:commAdmin.communityId,
    description:shortDescription,
    image:{
      url:imageUrl,
      publicId
    }
  }
  const newGroup=new Group(data)
  await newGroup.save()


    const community = await Community.findById(commAdmin.communityId);
    if (!community) {
      throw new NotFoundError('Community not found');
    }

    community.groups.push(newGroup._id);
    await community.save();


    res.status(201).json(newGroup);
}) 

const editGroup=asyncErrorHandler(async (req: Request, res: Response) =>{
  
  const { id, name, imageUrl, publicId, description } = req.body;

  if (!name) {
    throw new BadRequestError("Group name is required");
  }

 
  const group = await Group.findById(id);

  if (!group) {
    throw new NotFoundError('Group not found');
  }
  
  const existingGroup = await Group.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    communityId: group.communityId,
    _id: { $ne: id }, 
  });
  if (existingGroup) {
    throw new ConflictError('Another group with the same name already exists in the community');
  }


  
  const oldImage = group.image;


  group.name = name;
  group.description = description;

  
  if(group.image&&oldImage){
  if (imageUrl && publicId) {
    group.image.url = imageUrl;
    group.image.publicId = publicId;

    if (oldImage.url !== imageUrl) {
      await cloudinary.uploader.destroy(oldImage.publicId);
    }
  }
    
}
  await group.save();
  res.status(200).send({ message: 'Group updated successfully', group });
})
const deleteGroup=asyncErrorHandler(async (req: Request, res: Response) =>{
  const{id}=req.query//group id
 
  const gg=await Group.findById(id)
  
  const grouopToDelete=await Group.findByIdAndDelete(id)
  if(!grouopToDelete){
    throw new NotFoundError('Group data not found')
  }
  
  const updateResult = await Community.updateOne(
    { _id: grouopToDelete.communityId }, 
    { $pull: { groups: grouopToDelete._id } } 
  );

  if (updateResult.modifiedCount === 0)  {
    throw new NotFoundError('Community not found or group not associated with community');
  }

  // Respond with success message
  res.status(200).json({ message: 'Group deleted successfully' });
})
const isUserMember=asyncErrorHandler(async (req: Request, res: Response) =>{
const{userId,groupId}=req.query
if(!userId||!groupId){
  throw new BadRequestError('UserId and Group id are required.')
}
const user=await User.findById(userId)
if(!user){
  throw new NotFoundError('User data not found.')
}
const isMemberIndex=user.groupIds.findIndex(id=>id.toString()==groupId)
const isMember = isMemberIndex !== -1;

return res.status(200).json({ isMember });
})
const joinGroup = asyncErrorHandler(async (req: Request, res: Response) => {
  
  const { userId, groupId } = req.query;

  if (!userId || !groupId) {
      throw new BadRequestError('UserId and GroupId are required.');
  }
  const userObjectId = new mongoose.Types.ObjectId(userId as string);
  const groupObjectId = new mongoose.Types.ObjectId(groupId as string);
  

  const user = await User.findById(userId);
  if (!user) {
      throw new NotFoundError('User not found.');
  }

  const group = await Group.findById(groupId);
  if (!group) {
      throw new NotFoundError('Group not found.');
  }
 
  if (group.members.includes(userObjectId)) {
    throw new ConflictError('User is already a member of the group.')
  }
  user.groupIds.push(groupObjectId);
  await user.save();

 
  group.members.push(userObjectId);
  await group.save();

  return res.status(200).json({ message: 'Successfully joined the group.' });
});
   export{
    fetchGroupsData,
    fetchGroupsDataUser,
    fetchGroupMembersData,
    addGroupsData,
    deleteGroup,
    editGroup,
    isUserMember,
    joinGroup
   }