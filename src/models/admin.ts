import mongoose, { Document, Schema } from "mongoose";
import bcrypt from 'bcrypt';

// Define interface for Admin document
interface IAdmin extends Document {
    role:string;
    userName:string;
    email: string;
    password: string;
   
}

// Define schema for Admin
const adminSchema: Schema<IAdmin> = new mongoose.Schema({
    role:{
        type:String,
       default:'admin'
    },
    userName:{
        type:String,
       default:'Admin'
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
    try {
        // Only hash the password if it has been modified or is new
        if (!this.isModified('password')) {
            return next();
        }
        
        // Generate salt
        const salt = await bcrypt.genSalt(10);
        
        // Hash the password with the salt
        const hashedPassword = await bcrypt.hash(this.password, salt);
        
        // Replace the plain password with the hashed one
        this.password = hashedPassword;
        next();
    } catch (error:any) {
        next(error);
    }
});



// Define Admin model
const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

export default Admin;