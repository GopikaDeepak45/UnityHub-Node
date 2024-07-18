import mongoose, { Document, Schema } from "mongoose";
interface Image {
    url: string;
    publicId: string
}
interface ServiceCategory {
    [x: string]: any;
    category: string;
    serviceIds: mongoose.Types.ObjectId[];
  }
export interface CommunityInterface extends Document {
    name: string
    description?: string;
    location: string
    isBlocked: boolean
    blockReason: string
    members: mongoose.Types.ObjectId[];
    hero: Image | null;
    groups: mongoose.Types.ObjectId[];
    pendingServices: mongoose.Types.ObjectId[]; 
    categorizedServices: ServiceCategory[];
}

const communitySchema: Schema<CommunityInterface> = new mongoose.Schema({
    name: {
        type: String,
        required: true,

    },
    description: String,
    location: {
        type: String,
        required: true
    },

    isBlocked: {
        type: Boolean,
        default: false
    },
    blockReason: {
        type: String
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommunityMember' }],
    hero: {
        url: String,
        publicId: String
    },

    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    pendingServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserService' }],
    categorizedServices: [
      {
        category: String,
        serviceIds: [mongoose.Schema.Types.ObjectId],
      },
    ],
    
}, {
    timestamps: true
});

const Community = mongoose.model('Community', communitySchema);

export default Community;
