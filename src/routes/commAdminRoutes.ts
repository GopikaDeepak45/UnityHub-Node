import express from 'express';
import { commAdminRegster, getCommunityAdminData, verifyOTP} from "../controllers/commAdminController"
import { addCommunityImage, addCommunityMember, deleteCommunityImage, deleteCommunityMember, editCommunityMember, fetchCommunityData,  } from '../controllers/communityController';
import verifyToken from '../middlewares/verifyToken';
// import { addBuildingService } from '../controllers/buildingServiceController';
import { addGroupsData, deleteGroup, editGroup, fetchGroupsData } from '../controllers/groupsController';
import checkCommunityAdminBlockedStatus from '../middlewares/checkCommAdminBlockedStatus';
import { blockUser, fetchUsersData, unblockUser } from '../controllers/userController';
import { addBuildingService, deleteBuildingService, editBuildingService, getBuildingServicesdata } from '../controllers/buildingServiceController';
import { approveService, fetchAllUserServicesAdmin, getCommunityCategories, rejectService } from '../controllers/userServiceController';


const router = express.Router();

router.post('/register',commAdminRegster)
router.post('/otp',verifyOTP)

//middlewares
router.use(verifyToken)
router.use(checkCommunityAdminBlockedStatus)

router.post('/images/addImage',addCommunityImage)
 router.delete('/images/deleteImage',deleteCommunityImage)
router.get('/profile',getCommunityAdminData) 
 router.get('/community',fetchCommunityData)
 router.get('/users',fetchUsersData)
 router.post('/user/block',blockUser)
 router.post('/user/unblock',unblockUser)
 router.post('/members/add',addCommunityMember)
 router.put('/member/edit',editCommunityMember)
 router.delete('/member/delete',deleteCommunityMember) 

 router.get('/groups',fetchGroupsData)
 router.post('/groups/add-group',addGroupsData)
 router.put('/groups/edit',editGroup)
 router.delete('/groups/delete',deleteGroup) 

 router.get('/building-services',getBuildingServicesdata)
router.post('/building-services/addService',addBuildingService)
router.delete('/building-services/delete',deleteBuildingService)
router.put('/building-services/edit-service',editBuildingService)

router.get('/user-services/:commAdminId',fetchAllUserServicesAdmin)
router.get('/user-services/categories/:commAdminId',getCommunityCategories)
router.post('/user-service/approve',approveService)
router.post('/user-service/reject',rejectService)
 
export default router;
