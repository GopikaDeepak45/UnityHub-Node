import mongoose, { Document, Schema } from 'mongoose';

// Define interface for Unverified User document
interface UnverifiedUserInterface extends Document {
    role: string;
    userName: string;
    email: string;
    contactNo: string;
    block: string;
    flatNo: string;
    password: string;
    otp: string;
    communityId: Schema.Types.ObjectId;
    createdAt: Date;
}

const unverifiedUserSchema = new Schema<UnverifiedUserInterface>({
    role: {
        type: String,
        default: 'user'
    },
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    contactNo: {
        type: String,
        required: true
    },
    block: {
        type: String,
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
    otp: {
        type: String
    },
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Expire documents after 1 hour
    }
}, {
    timestamps: true
});

const UnverifiedUser = mongoose.model<UnverifiedUserInterface>('UnverifiedUser', unverifiedUserSchema);

export default UnverifiedUser;
