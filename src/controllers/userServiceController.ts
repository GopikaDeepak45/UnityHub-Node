import mongoose from "mongoose";
import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import asyncErrorHandler from "../middlewares/asyncErrorHandler";
import CommAdmin from "../models/commAdmin";
import Community from "../models/community";
import User from "../models/user";
import UserService from "../models/userServices";

interface IService {
  _id: mongoose.Types.ObjectId;
  serviceName: string;
  description: string;
  isApproved: boolean;
  providerId: {
    _id: mongoose.Types.ObjectId;
    userName: string;
    block: string;
  };
}

interface IServiceCategory {
  category: string;
  serviceIds: mongoose.Types.ObjectId[];
}

interface IServiceCategoryArray {
  category: string;
  serviceIds: IService[];
}

const addService=asyncErrorHandler(async(req,res)=>{
console.log('enter add user service',req.body)
const { serviceName, details,providerId:userId } = req.body;
    
    const user=await User.findById(userId)
if(!user){
    throw new NotFoundError('user not found')
}
    const community = await Community.findById(user.communityId);
    if (!community) {
      throw new NotFoundError('Community not found')
    }

    const newService = new UserService({
      serviceName,
      details,
      providerId: userId,
      communityId: community._id,
      isApproved: false,
    });

    await newService.save();

    community.pendingServices.push(newService._id);
    await community.save();

    res.status(201).json({ message: 'Service added to pending services', service: newService });
 
})
const approveService=asyncErrorHandler(async (req,res)=>{
  console.log('enter approve service',req.body)
    const { serviceId, category } = req.body;
if(!category){
  throw new BadRequestError('Category needed')
}
       const userService = await UserService.findById(serviceId);
    if (!userService) {
      throw new NotFoundError('User service not found')
    }

    const community = await Community.findById(userService.communityId);
    if (!community) {
      throw new NotFoundError('Community not found')
    }

    const serviceIndex = community.pendingServices.findIndex(id => id.toString() === serviceId);
    if (serviceIndex === -1) {
      throw new NotFoundError('Service not found in pending services')
    }
    
    userService.isApproved = true;
    userService.isRejected=false
    userService.category=category
    userService.rejectionReason=""
    await userService.save();

    community.pendingServices.splice(serviceIndex, 1);

    let serviceCategory = community.categorizedServices.find(cat => cat.category === category);
    if (!serviceCategory) {
      serviceCategory = { category, serviceIds: [serviceId] };
      community.categorizedServices.push(serviceCategory);
    }
    serviceCategory.serviceIds.push(serviceId);
    await community.save();

    res.status(200).json({ message: 'Service approved and categorized', service: userService });
  
})
const rejectService=asyncErrorHandler(async(req,res)=>{
  console.log('enter reject service')
  const { serviceId, rejectionReason } = req.body;

  const userService = await UserService.findById(serviceId);
if (!userService) {
 throw new NotFoundError('User service not found')
}

const community = await Community.findById(userService.communityId);
if (!community) {
 throw new NotFoundError('Community not found')
}

// const serviceIndex = community.pendingServices.findIndex(id => id.toString() === serviceId);
// if (serviceIndex === -1) {
//   const communityService = community.services.find(service => service.id.toString() === serviceId);
//   if (!communityService) {
//     throw new NotFoundError('Service not found in community services');
//   }}
const serviceIndex = community.pendingServices.findIndex(id => id.toString() === serviceId);
  if (serviceIndex === -1) {
    // If not found in pendingServices, search in the community's categorizedServices
    let foundInCategorizedServices = false;

    for (const category of community.categorizedServices) {
      const categorizedServiceIndex = category.serviceIds.findIndex(id => id.toString() === serviceId);
      if (categorizedServiceIndex !== -1) {
        foundInCategorizedServices = true;
        // Remove the service from the category's serviceIds
        category.serviceIds.splice(categorizedServiceIndex, 1);
        //add to pendings 
        community.pendingServices.push(serviceId)
        break;
      }
    }

    if (!foundInCategorizedServices) {
      throw new NotFoundError('Service not found in community services');
    }
  } 
userService.isRejected = true;
    userService.rejectionReason = rejectionReason;
    await userService.save();

   

    await community.save();

    res.status(200).json({ message: 'Service rejected', service: userService });
})
const fetchService=asyncErrorHandler(async (req,res)=>{
 
  const userId = req.params.userId;

  if (!userId) {
    throw new BadRequestError('User ID is required');
  }
  const services = await UserService.find({ providerId: userId});
  
  res.status(200).json(services.length ? services : []);
})
const editService=asyncErrorHandler(async(req,res)=>{
const{serviceName,details,id}=req.body
const userService = await UserService.findById(id);
    if (!userService) {
      throw new NotFoundError('User service not found')
    }
    userService.serviceName=serviceName
    userService.details=details
    userService.save()
    res.status(200).json({message:'Service updated successfully'})
})
const deleteService=asyncErrorHandler(async (req,res)=>{
const { serviceId } = req.params;
    const service = await UserService.findByIdAndDelete(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    const community = await Community.findById(service.communityId);
    if (community) {
    
      for (const category in community.categorizedServices) {
        community.categorizedServices[category] = community.categorizedServices[category].filter(
          (id: { toString: () => string; }) => id.toString() !== serviceId
        );
      }

   //from pendings also
      community.pendingServices = community.pendingServices.filter(
        pendingService => pendingService._id.toString() !== serviceId
      );

      await community.save();
    }

    res.status(200).json({ message: 'Service deleted successfully' });
})
const fetchAllUserServicesAdmin=asyncErrorHandler(async(req,res)=>{
  const { commAdminId } = req.params; 

  const commAdmin=await CommAdmin.findById(commAdminId)
  if(!commAdmin){
    throw new NotFoundError('Community admin not found with given id')
  }
  const userServices: IService[] = await UserService.find({ communityId:commAdmin.communityId })
    .populate('providerId', 'userName block') 

   res.status(200).json(userServices);
})
// const fetchApprovedUserServices = asyncErrorHandler(async (req, res) => {
//   const { userId } = req.params;

//   const user=await User.findById(userId)
//   if (!user) {
//     throw new NotFoundError('Community admin not found with given id');
//   }

//   const approvedUserServices: IService[] = await UserService.find({
//     communityId: user.communityId,
//     isApproved: true // Assuming you have an 'isApproved' field in your UserService schema
//   }).populate('providerId', 'userName block');

//   res.status(200).json(approvedUserServices);
// });

// const fetchApprovedUserServices = asyncErrorHandler(async (req, res) => {
//   const { userId } = req.params;

//   const user = await User.findById(userId);
//   if (!user) {
//     throw new NotFoundError('User not found with given id');
//   }

//   const community = await Community.findById(user.communityId)
//     .populate({
//       path: 'categorizedServices.serviceIds',
//       populate: { path: 'providerId', select: 'userName block' }
//     });

//   if (!community) {
//     throw new NotFoundError('Community not found with given id');
//   }
// const allCategoriesAndServices=community.categorizedServices as unknown as IServiceCategoryArray[] 
//   // Filter services to only include approved ones
//   const approvedCategorizedServices = allCategoriesAndServices.map(category => ({
//     category: category.category,
//     services: category.serviceIds.filter(service => service.isApproved)
//   }));

//   res.status(200).json(approvedCategorizedServices);
// });
const fetchApprovedUserServices = asyncErrorHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found with given id');
  }

  const community = await Community.findById(user.communityId);
  if (!community) {
    throw new NotFoundError('Community not found with given id');
  }

  // Fetch services and populate provider details
  const categorizedServicesWithDetails = await Promise.all(
    community.categorizedServices.map(async (category) => {
      const services = await UserService.find({
        _id: { $in: category.serviceIds },
        isApproved: true
      }).populate('providerId', 'userName block');

      return {
        category: category.category,
        services: services as unknown as IService[]
      };
    })
  );

  res.status(200).json(categorizedServicesWithDetails);
});


const getCommunityCategories = asyncErrorHandler(async (req, res) => {
  const { commAdminId } = req.params;
  const commAdmin=await CommAdmin.findById(commAdminId) 
  if(!commAdmin){
    throw new NotFoundError('Community admin not found with given id')
  }

  const community = await Community.findById(commAdmin.communityId);
  if (!community) {
    throw new NotFoundError('Community not found');
  }
  const categories=community.categorizedServices.map(item=>item.category)
console.log('categories',categories)
  res.status(200).json({ categories });
});
export{addService,
    approveService,
    rejectService,
    fetchService,
    editService,
    deleteService,
    fetchAllUserServicesAdmin,
    getCommunityCategories,
    fetchApprovedUserServices,
}