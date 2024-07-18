import mongoose, { Schema } from "mongoose";

interface CommentInterface {
    postId:mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    content: string;
    likes: mongoose.Types.ObjectId[];
    createdAt: Date;
  }
  
  const commentSchema = new Schema<CommentInterface>({
    postId:{
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  const Comment=mongoose.model<CommentInterface>('Comment',commentSchema)

  export default Comment