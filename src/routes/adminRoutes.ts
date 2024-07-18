import express from 'express';
import { addCorePackage, addImage, deleteCorePackage, deleteImage, editCorePackage } from '../controllers/landingPageControlller';
import verifyToken from '../middlewares/verifyToken';
import { blockCommunity, fetchCommunitiesData, messageToCommunityAdmin, unblockCommunity } from '../controllers/communityController';

const router = express.Router();
router.use(verifyToken)

 router.post('/images/addImage',addImage)
 router.post('/images/deleteImage',deleteImage)
 router.get('/community',fetchCommunitiesData)
 router.post('/community/message',messageToCommunityAdmin) 
 router.post('/community/block',blockCommunity) 
 router.post('/community/unblock',unblockCommunity)
 router.post('/packages/addPackagee',addCorePackage)
 router.post('/packages/editPackage',editCorePackage)
 router.post('/packages/deletePackage',deleteCorePackage)

export default router;