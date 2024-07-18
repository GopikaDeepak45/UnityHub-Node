import mongoose, { Document, Schema } from "mongoose";
interface Image {
  url: string;
  publicId: string;
}
interface IMessage extends Document {
  sender: mongoose.Types.ObjectId; 
  content: string;
  timestamp: Date;
}

const messageSchema: Schema<IMessage> = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: String,
  timestamp: { type: Date, default: Date.now },
});

interface IGroup extends Document {
  name: string;
  communityId: mongoose.Types.ObjectId;
  description?: string;
  members: mongoose.Types.ObjectId[];
  groupChats: {
    messages: IMessage[];
  }[];
  image: Image | null;
  postImages: Image[];
  isBlocked: boolean;
  blockReason: string;
}

const groupSchema: Schema<IGroup> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community", // Reference to Community model
      required: true,
    },
    image: { url: String, publicId: String },
    postImages: [
      {
        url: String,
        publicId: String,
      },
    ],
    description: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    groupChats: [
      {
        messages: [messageSchema],
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Group = mongoose.model<IGroup>("Group", groupSchema);

export default Group;
