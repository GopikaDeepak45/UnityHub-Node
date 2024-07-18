import mongoose, { Schema } from "mongoose";

interface CommentInterface {
    postId:mongoose.Types.ObjectId;
    groupId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    content: string;
    likes: mongoose.Types.ObjectId[];
    createdAt: Date;
  }
  
  const groupsCommentSchema = new Schema<CommentInterface>({
    postId:{
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
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

  const GroupsComment=mongoose.model<CommentInterface>('GroupsComment',groupsCommentSchema)

  export default GroupsComment