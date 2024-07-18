import mongoose, { Schema, Document } from 'mongoose';
interface Image {
  url: string;
  publicId: string
}
interface MediaInterface {
  data: Image;
  type: 'image' | 'video';
}

interface PostInterface extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  communityId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  media: MediaInterface[]; 
  createdAt: Date;
  likes: mongoose.Types.ObjectId[]; 
  comments: mongoose.Types.ObjectId[];
}

const groupsPostSchema = new Schema<PostInterface>({
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
  communityId: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group', // Reference to the Group model
    required: true,
  },
  media: [
    {
      data: {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        }
      },
      type: {
        type: String,
        enum: ['image', 'video'],
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments:[
    {
      type: Schema.Types.ObjectId,
      ref: 'GroupsComment',
    },
  ],
});

const GroupsPost = mongoose.model<PostInterface>('GroupsPost', groupsPostSchema);

export default GroupsPost;
