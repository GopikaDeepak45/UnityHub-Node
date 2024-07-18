import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { CommunityInterface } from './community';

interface Image {
    url: string;
    publicId: string
}
interface ConnectionRequest {
    fromUserId: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'declined';
    sentAt: Date;
    respondedAt?: Date;
}
export interface UserInterface extends Document {
    role:string
    userName: string;
    email: string;
    contactNo: string;
    profileImg:Image | null;
    communityId: Schema.Types.ObjectId |CommunityInterface;
    block: string;
    flatNo: string;
    password: string;
    isVerified:boolean
    isBlocked:boolean
    blockReason:string
    groupIds: mongoose.Types.ObjectId[]; 
    connectionRequests: ConnectionRequest[];
    connections: mongoose.Types.ObjectId[];
}

const userSchema = new Schema<UserInterface>({
    role:{
        type:String,
       default:'user'
    },
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    profileImg:{
        url: String,
        publicId: String
    },
    block: {   
        type: String,
        required: true
    },
    contactNo: {
        type: String,
        required: true
    },
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    flatNo: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    blockReason:{
        type:String
    },
    groupIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Group'
    }],
    connectionRequests: [{
        fromUserId: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        respondedAt: {
            type: Date
        }
    }],
    connections: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

// Hash password before saving
userSchema.pre<UserInterface>('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error:any) {
        next(error);
    }
});

const User = mongoose.model<UserInterface>('User', userSchema);

export default User;
