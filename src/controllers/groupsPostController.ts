import { Request, Response } from "express";
import asyncErrorHandler from "../middlewares/asyncErrorHandler";
import { BadRequestError } from "../errors/BadRequestError";
import User from "../models/user";
import { NotFoundError } from "../errors/NotFoundError";
import Post from "../models/post";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import Comment from "../models/comments";
import GroupsPost from "../models/groupsPost";
import GroupsComment from "../models/groupsComments";
import { ForbiddenError } from "../errors/ForbiddenError";

interface MediaData {
  url: string;
  publicId: string;
}

// Define an interface for a media object
interface MediaInterface {
  data: MediaData;
  type: "image" | "video";
}
const fetchPostDataGroups = asyncErrorHandler(async (req: Request, res: Response) => {
  const { groupId, page, limit } = req.query;

 
  const pageNumber = parseInt(page as unknown as string, 10);
  const limitNumber = parseInt(limit as unknown as string, 10);

  const skip = (pageNumber - 1) * limitNumber;
 
 
  const posts = await GroupsPost.find({ groupId })
    .sort({ createdAt: -1 }) // Sort by latest createdAt date
    .skip(skip) // Skip the number of documents
    .limit(limitNumber) // Limit the number of documents
    .populate("userId", "userName profileImg") // Populate user details
    .populate("comments.userId"); // Populate comment user details

  // Get the total number of posts
  const totalPosts = await GroupsPost.countDocuments({
    groupId
  });

  // Check if there are more posts to load
  const hasMore = pageNumber * limitNumber < totalPosts;

  // Return the posts and pagination info
  res.status(200).json({
    posts,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalPosts / limitNumber),
    hasMore,
  });
});
const fetchCommentsDataGroups = asyncErrorHandler(
  async (req: Request, res: Response) => {
    console.log("enter fetch comments data group");

    const { postId } = req.query;
    
    const comments = await GroupsComment.find({ postId }).populate(
      "userId",
      "userName profileImg"
    );

      
    res.status(200).json(comments);
  }
);

const addPostGroups = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("enter add post groups", req.body);
  const { userId,groupId, content, imageData, videoData } = req.body;

  // Validate input data
  if (!userId || !content||!groupId) {
    throw new BadRequestError("User ID, groupId and content are required");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User data not found");
  }
  // Create an array of media objects
  const media: MediaInterface[] = [];

  // Add image data to media array
  if (imageData && imageData.length > 0) {
    imageData.forEach((image: MediaData) => {
      media.push({
        data: {
          url: image.url,
          publicId: image.publicId,
        },
        type: "image",
      });
    });
  }

  // Add video data to media array
  if (videoData && videoData.length > 0) {
    videoData.forEach((video: MediaData) => {
      media.push({
        data: {
          url: video.url,
          publicId: video.publicId,
        },
        type: "video",
      });
    });
  }

 
  const newPost = new GroupsPost({
    userId,
    groupId,
    content,
    communityId: user.communityId,
    media,
  });

  // Save the post to the database
  const savedPost = await newPost.save();

  // Respond with the saved post
  res.status(201).json(savedPost);
});
const deleteGroupPost = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("ENTER DELETE GROUP POST", req.query);

  // Explicitly convert query parameters to strings
  const postId = req.query.postId?.toString();
  const userId = req.query.userId?.toString();

  console.log("postId:", postId);
  console.log("userId:", userId);

  if (
    !postId ||
    !userId ||
    typeof postId !== "string" ||
    typeof userId !== "string"
  ) {
    throw new BadRequestError(
      "postId and userId are required and must be strings"
    );
  }

  // Check if postId and userId are valid ObjectIds
  if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId)) {
    throw new BadRequestError("Invalid postId or userId");
  }

  const postObjectId = new ObjectId(postId);
  const userObjectId = new ObjectId(userId);

  const post = await GroupsPost.findById(postObjectId);
  if (!post) {
    throw new NotFoundError("Post not found");
  }

  // Check if the user requesting the deletion is the owner of the post
  if (!post.userId.equals(userObjectId)) {
    throw new ForbiddenError("You are not authorized to delete this post");
  }

  // Delete the post
  await GroupsPost.deleteOne({ _id: postObjectId });

  res.status(200).json({ message: "Group post deleted successfully" });
});

const addLikeGroups = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("ENTER LIKE POST groups", req.query);
  const postId = req.query.postId;
  const userId = req.query.userId;

  if (
    !postId ||
    !userId ||
    typeof postId !== "string" ||
    typeof userId !== "string"
  ) {
    throw new BadRequestError(
      "postId and userId are required and must be strings"
    );
  }

  // Check if postId and userId are valid ObjectIds
  if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId)) {
    throw new BadRequestError("Invalid postId or userId");
  }

  // Convert userId to ObjectId
  const userObjectId = new ObjectId(userId);

  const post = await GroupsPost.findById(postId);
  if (!post) {
    throw new NotFoundError("Post data not found");
  }

  // Check if userObjectId is already in likes array
  if (!post.likes.includes(userObjectId)) {
    post.likes.push(userObjectId);
    await post.save();
  }

  res.status(200).json(post);
});
const deleteLikeGroups = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("enter unlike grp", req.query);
  const postId = req.query.postId;
  const userId = req.query.userId;

  if (
    !postId ||
    !userId ||
    typeof postId !== "string" ||
    typeof userId !== "string"
  ) {
    throw new BadRequestError(
      "postId and userId are required and must be strings"
    );
  }

  const post = await GroupsPost.findById(postId);
  if (!post) {
    throw new NotFoundError("Post data not found");
  }
 
  const userObjectId = new ObjectId(userId);

  post.likes = post.likes.filter(
    (objId) => objId.toString() !== userObjectId.toString()
  );

   await post.save();

  res.status(200).json(post);
});
const addCommentLikeGroups = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("ENTER LIKE comment grp", req.query);
  const commentId = req.query.commentId;
  const userId = req.query.userId;

  if (
    !commentId ||
    !userId ||
    typeof commentId !== "string" ||
    typeof userId !== "string"
  ) {
    throw new BadRequestError(
      "postId and userId are required and must be strings"
    );
  }

  // Check if postId and userId are valid ObjectIds
  if (!ObjectId.isValid(commentId) || !ObjectId.isValid(userId)) {
    throw new BadRequestError("Invalid postId or userId");
  }

  // Convert userId to ObjectId
  const userObjectId = new ObjectId(userId);

  const comment = await GroupsComment.findById(commentId);
  if (!comment) {
    throw new NotFoundError("Comment data not found");
  }

  // Check if userObjectId is already in likes array
  if (!comment.likes.includes(userObjectId)) {
    comment.likes.push(userObjectId);
    await comment.save();
  }

  res.status(200).json(comment);
});
const deleteCommentLikeGroups = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("ENTER UNLIKE comment grp", req.query);

  // Explicitly convert query parameters to strings
  const commentId = req.query.commentId?.toString();
  const userId = req.query.userId?.toString();

  console.log("commentId:", commentId);
  console.log("userId:", userId);

  if (
    !commentId ||
    !userId ||
    typeof commentId !== "string" ||
    typeof userId !== "string"
  ) {
    throw new BadRequestError(
      "commentId and userId are required and must be strings"
    );
  }

  // Check if commentId and userId are valid ObjectIds
  if (!ObjectId.isValid(commentId) || !ObjectId.isValid(userId)) {
    throw new BadRequestError("Invalid commentId or userId");
  }

  const userObjectId = new ObjectId(userId);
  const commentObjectId = new ObjectId(commentId);

  const comment = await GroupsComment.findById(commentObjectId);
  if (!comment) {
    throw new NotFoundError("Comment data not found");
  }
  
  console.log("comment likes before:", comment.likes);

  // Remove userId from likes
  comment.likes = comment.likes.filter(
    (objId) => objId.toString() !== userObjectId.toString()
  );

  console.log("comment likes after:", comment.likes);

  await comment.save();

  res.status(200).json(comment);
});

const addCommentGroups = asyncErrorHandler(async (req: Request, res: Response) => {
  const { userId,groupId, content, postId } = req.body;
  console.log("add comment", req.body);
  if (!userId || !content || !postId) {
    throw new BadRequestError("user id post id and comment are required");
  }
  const post = await GroupsPost.findById(postId);
  if (!post) {
    throw new NotFoundError("Post data not found");
  }

  const newComment = new GroupsComment({
    postId,
    groupId,
    userId,
    content,
    createdAt: new Date(),
    likes: [],
  });

  await newComment.save();
  post.comments.push(newComment._id);
  await post.save();

  res.status(201).json(post);
});
export {
  fetchPostDataGroups,
  fetchCommentsDataGroups,
  addPostGroups,
  deleteGroupPost,
  addLikeGroups,
  addCommentGroups,
  addCommentLikeGroups,
  deleteCommentLikeGroups,
  deleteLikeGroups,
};
