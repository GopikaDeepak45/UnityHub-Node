import { Request, Response } from "express";
import asyncErrorHandler from "../middlewares/asyncErrorHandler";
import { BadRequestError } from "../errors/BadRequestError";
import User from "../models/user";
import { NotFoundError } from "../errors/NotFoundError";
import Post from "../models/post";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import Comment from "../models/comments";
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
const fetchPostData = asyncErrorHandler(async (req: Request, res: Response) => {
  const { userId, page, limit } = req.query;

  // Convert page and limit to integers
  const pageNumber = parseInt(page as unknown as string, 10);
  const limitNumber = parseInt(limit as unknown as string, 10);

  // Calculate the number of documents to skip
  const skip = (pageNumber - 1) * limitNumber;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  // Fetch posts from the database with pagination
  const posts = await Post.find({ communityId: user.communityId })
    .sort({ createdAt: -1 }) // Sort by latest createdAt date
    .skip(skip) // Skip the number of documents
    .limit(limitNumber) // Limit the number of documents
    .populate("userId", "userName profileImg") // Populate user details
    .populate("comments.userId"); // Populate comment user details

  // Get the total number of posts
  const totalPosts = await Post.countDocuments({
    communityId: user.communityId,
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
const fetchPostDataUser = asyncErrorHandler(async (req: Request, res: Response) => {
  const { userId, page, limit } = req.query;

  // Convert page and limit to integers
  const pageNumber = parseInt(page as unknown as string, 10);
  const limitNumber = parseInt(limit as unknown as string, 10);

  // Calculate the number of documents to skip
  const skip = (pageNumber - 1) * limitNumber;
  console.log("skippp", skip);
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  // Fetch posts from the database with pagination
  const posts = await Post.find({ userId })
    .sort({ createdAt: -1 }) // Sort by latest createdAt date
    .skip(skip) // Skip the number of documents
    .limit(limitNumber) // Limit the number of documents
    .populate("userId", "userName profileImg") // Populate user details
    .populate("comments.userId"); // Populate comment user details

  // Get the total number of posts
  const totalPosts = await Post.countDocuments({
    userId
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
const fetchCommentsData = asyncErrorHandler(
  async (req: Request, res: Response) => {
    

    const { postId, userId } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const comments = await Comment.find({ postId }).populate(
      "userId",
      "userName profileImg"
    );

    
    // Return the posts and pagination info
    res.status(200).json(comments);
  }
);

const addPost = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("enter add post", req.body);
  const { userId, content, imageData, videoData } = req.body;

  // Validate input data
  if (!userId || !content) {
    throw new BadRequestError("User ID and content are required");
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

  // Create a new post
  const newPost = new Post({
    userId,
    content,
    communityId: user.communityId,
    media,
  });

  // Save the post to the database
  const savedPost = await newPost.save();

  // Respond with the saved post
  res.status(201).json(savedPost);
});
const deletePost = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("ENTER DELETE POST", req.query);


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

 
  if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId)) {
    throw new BadRequestError("Invalid postId or userId");
  }

  const postObjectId = new ObjectId(postId);
  const userObjectId = new ObjectId(userId);

  const post = await Post.findById(postObjectId);
  if (!post) {
    throw new NotFoundError("Post not found");
  }

  
  if (!post.userId.equals(userObjectId)) {
    throw new ForbiddenError("You are not authorized to delete this post");
  }

 
   await Post.deleteOne({ _id: postObjectId });

  res.status(200).json({ message: "Post deleted successfully" });
});
const addLike = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("ENTER LIKE POST", req.query);
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

  const post = await Post.findById(postId);
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
const deleteLike = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("enter unlike", req.query);
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

  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError("Post data not found");
  }
  console.log("post likes before:", post.likes);
  console.log("userId:", userId);

  // Convert userId to ObjectId
  const userObjectId = new ObjectId(userId);

  // Remove userId from likes

  post.likes = post.likes.filter(
    (objId) => objId.toString() !== userObjectId.toString()
  );

  console.log("post likes after:", post.likes);

  await post.save();

  res.status(200).json(post);
});
const addCommentLike = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("ENTER LIKE comment", req.query);
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

  const comment = await Comment.findById(commentId);
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
const deleteCommentLike = asyncErrorHandler(async (req: Request, res: Response) => {
  console.log("ENTER UNLIKE comment", req.query);

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

  const comment = await Comment.findById(commentObjectId);
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

const addComment = asyncErrorHandler(async (req: Request, res: Response) => {
  const { userId, content, postId } = req.body;
  console.log("add comment", req.body);
  if (!userId || !content || !postId) {
    throw new BadRequestError("user id post id and comment are required");
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError("Post data not found");
  }

  const newComment = new Comment({
    postId,
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
  fetchPostData,
  fetchPostDataUser,
  fetchCommentsData,
  addPost,
  deletePost,
  addLike,
  addComment,
  addCommentLike,
  deleteCommentLike,
  deleteLike,
};
