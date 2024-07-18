import mongoose, { Document, Schema } from "mongoose";

// Define interface for Unverified Community Admin document
interface IUnverifiedCommAdmin extends Document {
    role: string;
    userName: string;
    communityName:string
    communityLocation:string
    email: string;
    password: string;
    mobileNo: number;
    otp: string;
    createdAt: Date;
}

const unverifiedCommAdminSchema: Schema<IUnverifiedCommAdmin> = new mongoose.Schema({
    role: {
        type: String,
        default: 'commAdmin'
    },
    userName: {
        type: String,
        required: true
    },
    communityName:{
        type:String,
        required:true
    },
    communityLocation:{
        type:String,
        required:true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String
    },
    mobileNo: {
        type: Number,
        required: true
    },
    otp: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Expire documents after 1 hour
    }
}, {
    timestamps: true
});

const UnverifiedCommAdmin = mongoose.model<IUnverifiedCommAdmin>('UnverifiedCommAdmin', unverifiedCommAdminSchema);

export default UnverifiedCommAdmin;
