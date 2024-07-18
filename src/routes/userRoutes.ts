import express from "express";
import verifyToken from "../middlewares/verifyToken";
import { acceptConnectionRequest, changePassword, declineConnectionRequest, fetchUsersData, fetchUsersDataByUser, getBasicUserInfo, getUserConnections, getUserInfo, sendConnectionRequest, updateProfile, userRegister, verifyOTP } from "../controllers/userController";
import { fetchGroupMembersData, fetchGroupsDataUser, isUserMember, joinGroup } from "../controllers/groupsController";
import { addComment, addCommentLike, addLike, addPost, deleteCommentLike, deleteLike, deletePost, fetchCommentsData, fetchPostData, fetchPostDataUser } from "../controllers/postController";
import checkUserBlockedStatus from "../middlewares/checkUserBlockedStatus";
import { addBuildingServiceSchedule, getAvailableSlotsForDay, getBuildingServicesdataUser } from "../controllers/buildingServiceController";
import { addCommentGroups, addCommentLikeGroups, addLikeGroups, addPostGroups, deleteCommentLikeGroups, deleteLikeGroups, fetchCommentsDataGroups, fetchPostDataGroups } from "../controllers/groupsPostController";
import { addService, deleteService, editService, fetchApprovedUserServices, fetchService } from "../controllers/userServiceController";

const router = express.Router();

router.post('/register',userRegister)
router.post('/otp',verifyOTP)
//middlewares
router.use(verifyToken)
router.use(checkUserBlockedStatus)

router.get('/users',fetchUsersDataByUser)

router.get('/basicInfo',getBasicUserInfo)
router.get('/userInfo',getUserInfo)
router.put('/update-profile',updateProfile)
router.put('/change-password',changePassword)

router.get('/posts',fetchPostData)
router.get('/posts/my-posts',fetchPostDataUser)
router.get('/posts/comments',fetchCommentsData)
router.post('/posts/add',addPost)
router.delete('/posts/delete-post',deletePost)
router.post('/posts/like',addLike)
router.post('/posts/unlike',deleteLike)
router.post('/posts/comment/like',addCommentLike)
router.post('/posts/comment/unlike',deleteCommentLike)
router.post('/posts/comment',addComment)

router.get('/building-services',getBuildingServicesdataUser)
router.get('/building-service/free-slots',getAvailableSlotsForDay)
router.post('/building-service/schedule',addBuildingServiceSchedule)

router.get('/services/all/:userId',fetchApprovedUserServices)
router.post('/add-service',addService)
router.get('/service/:userId',fetchService)
router.put('/service/edit',editService)
router.delete('/service/delete/:serviceId',deleteService)

router.get('/connections/:userId',getUserConnections)
router.post('/connections/send-connection-request',sendConnectionRequest)
router.post('/connections/accept-connection-request',acceptConnectionRequest)
router.post('/connections/decline-connection-request',declineConnectionRequest)

router.get('/groups',fetchGroupsDataUser)
router.get('/group/isUserMember',isUserMember)
router.get('/group/members',fetchGroupMembersData)
router.post('/group/joinGroup',joinGroup)
router.get('/group/posts',fetchPostDataGroups)
router.get('/group/posts/comments',fetchCommentsDataGroups)
router.post('/group/posts/add',addPostGroups)
router.post('/group/posts/like',addLikeGroups)
router.post('/group/posts/unlike',deleteLikeGroups)
router.post('/group/posts/comment/like',addCommentLikeGroups)
router.post('/group/posts/comment/unlike',deleteCommentLikeGroups)
router.post('/group/posts/comment',addCommentGroups)


export default router;