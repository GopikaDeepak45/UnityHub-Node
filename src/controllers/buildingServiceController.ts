import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../middlewares/asyncErrorHandler";
import CommAdmin from "../models/commAdmin";
import BuildingService from "../models/BuildingServices";
import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from "../errors/BadRequestError";
import { v2 as cloudinary } from 'cloudinary';
import { ConflictError } from "../errors/ConflictError";
import User from "../models/user";
import { generateSlots } from "../utils/generateSlots";
import mongoose, { Types } from "mongoose";
interface CustomRequest extends Request {
  user?: {
    username: string;
    userId: string;
    role: string;
  };
}
const getBuildingServicesdata=asyncErrorHandler(async(req:Request,res:Response,next:NextFunction)=>{
    const { communityAdminId } = req.query;
console.log('fetch services data',req.query)
    // Find the community admin using communityAdminId
    const commAdmin = await CommAdmin.findById(communityAdminId);

    if (!commAdmin) {
      throw new NotFoundError('Community Admin not found');
    }

    
    const communityId = commAdmin.communityId;

    
    let buildingServices = await BuildingService.find({ communityId }).populate('scheduledTimes.scheduledBy','userName block flatNo');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    
    buildingServices = buildingServices.map(buildingService => {
      
      buildingService.scheduledTimes = buildingService.scheduledTimes.filter(schedule => {
        return schedule.scheduledDate >= today;
      });
      return buildingService;
    });
    
    res.status(200).json(buildingServices);
})
const getBuildingServicesdataUser=asyncErrorHandler(async(req:Request,res:Response,next:NextFunction)=>{
  const { userId } = req.query;
const user=await User.findById(userId)
if(!user){
  throw new NotFoundError('User not found')
}

  // Assuming commAdmin.communityId contains the ID of the community
  const communityId = user.communityId;

  // Find building services associated with the communityId
  const buildingServices = await BuildingService.find({ communityId });

  // Respond with the building services data
  res.status(200).json(buildingServices);
})

 const addBuildingService = asyncErrorHandler(async (req: Request, res: Response) => {
    
  const { name, description, communityAdminId, servicesPerHour} = req.body;

  if (!name || !description || !communityAdminId) {
    throw new BadRequestError("Name, description, and communityId are required");
  }
const commAdmin=await CommAdmin.findById(communityAdminId)
if(!commAdmin){
    throw new NotFoundError('Community admin data not found')
}
// Check if a similar service already exists for the community
const existingService = await BuildingService.findOne({
    name:{ $regex: new RegExp(`^${name}$`, 'i') },
    communityId: commAdmin.communityId,
  });

  if (existingService) {
    throw new ConflictError(`Service name already exists`)
  }
  const newBuildingService = new BuildingService({
    name,
    description,
    communityId:commAdmin.communityId,
    scheduledTimes: [],
    maxServicesPerHour:servicesPerHour
    
  });

  await newBuildingService.save();

  res.status(201).json({ message: 'Building service added successfully', buildingServices: newBuildingService });
});
const deleteBuildingService=asyncErrorHandler(async (req: Request, res: Response) => {
console.log('enter delete service',req.query)
const{id}=req.query
// Check if service ID is provided
if (!id) {
    throw new BadRequestError('Service ID is required');
  }

  const deletedService = await BuildingService.findByIdAndDelete(id as string);

 
  if (!deletedService) {
    throw new NotFoundError('Building service not found');
  }

 
  res.status(200).json({ message: 'Building service deleted successfully', deletedService });

})

const editBuildingService=asyncErrorHandler(async (req: Request, res: Response) => {
  console.log('enter edit service',req.body)
  const { id, name, description, communityAdminId, servicesPerHour } = req.body;

  if (!id || !name || !description || !communityAdminId) {
    throw new BadRequestError("ID, name, description, and communityId are required");
  }

  const commAdmin = await CommAdmin.findById(communityAdminId);
  if (!commAdmin) {
    throw new NotFoundError('Community admin data not found');
  }

  const buildingService = await BuildingService.findById(id);
  if (!buildingService) {
    throw new NotFoundError('Building service not found');
  }

  // Check if the new name conflicts with another service in the same community
  const existingService = await BuildingService.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    communityId: commAdmin.communityId,
    _id: { $ne: id } // Ensure it's not the current service
  });

  if (existingService) {
    throw new ConflictError(`Service name already exists in the community`);
  }

  buildingService.name = name;
  buildingService.description = description;
  buildingService.maxServicesPerHour = servicesPerHour;

  await buildingService.save();

  res.status(200).json({ message: 'Building service updated successfully', buildingService });

})
const getAvailableSlotsForDay=asyncErrorHandler(async (req: Request, res: Response) => {
// const{serviceId,date}=req.body
// const service=await BuildingService.findById(serviceId)
// let scheduledSlots=service.
// let servicePerHr=service?.maxServicesPerHour
// let totalSlots=generateSlots(servicePerHr)
const { serviceId, date } = req.query;
console.log('enter service free slot check')
console.log('id is,',serviceId,date)
    if (!serviceId||!date) {
      throw new BadRequestError('Service id and date required'); 
    }

    const service = await BuildingService.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }

    const selectedDate = new Date(date as string);

    const bookedSlots = service.scheduledTimes
      .filter(s => s.scheduledDate.toDateString() === selectedDate.toDateString())
      .map(s => s.scheduledTime);
console.log('booked',bookedSlots)
    const allSlots = generateSlots();
    console.log('all slots',allSlots)
    const freeSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
console.log('free',freeSlots)
    res.status(200).json(freeSlots);
})
const addBuildingServiceSchedule = asyncErrorHandler(async (req: CustomRequest, res: Response) => {
  console.log('ADD SCHEDULE', req.query);
  const { date, slot, serviceId, userId } = req.query;
  
  const buildingService = await BuildingService.findById(serviceId);

  if (!buildingService) {
    throw new NotFoundError('Building service not found.');
  }

  const scheduledDate = new Date(date as string);
  if (isNaN(scheduledDate.getTime())) {
    throw new BadRequestError('Invalid date format.');
  }

  const scheduledTime = parseInt(slot as string, 10);
  if (isNaN(scheduledTime) || scheduledTime < 9 || scheduledTime > 17) {
    throw new BadRequestError('Invalid slot value. Should be between 9 and 17.');
  }

   const slotTaken = buildingService.scheduledTimes.some(
    (schedule) => 
      schedule.scheduledDate.toISOString().split('T')[0] === scheduledDate.toISOString().split('T')[0] &&
      schedule.scheduledTime === scheduledTime
  );

  if (slotTaken) {
    throw new BadRequestError('This slot is already taken.');
  }

 
  const userScheduleIndex = buildingService.scheduledTimes.findIndex(
    (schedule) => 
      schedule.scheduledDate.toISOString().split('T')[0] === scheduledDate.toISOString().split('T')[0] &&
      schedule.scheduledBy.toString() === userId
  );
//if already have, update
  if (userScheduleIndex !== -1) {
   
    buildingService.scheduledTimes[userScheduleIndex].scheduledTime = scheduledTime;
  } else {
    // Add new
    const newScheduledService = {
      scheduledBy: new Types.ObjectId(userId as string),
      scheduledDate,
      scheduledTime,
    };
    buildingService.scheduledTimes.push(newScheduledService);
  }

  await buildingService.save();

  res.status(200).json({ message: 'Schedule added successfully', buildingService });
});
export {
    getBuildingServicesdata,
    getBuildingServicesdataUser,
    addBuildingService,
    deleteBuildingService,
    editBuildingService,
    getAvailableSlotsForDay,
    addBuildingServiceSchedule

 }