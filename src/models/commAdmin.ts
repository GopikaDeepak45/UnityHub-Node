import mongoose, { Document, Schema }  from "mongoose";
import bcrypt from 'bcrypt';

// Define interface for Community Admin document
interface ICommAdmin extends Document {
    role:string;
    userName:string
    communityId: mongoose.Types.ObjectId;
    email: string;
    password: string;
   mobileNo:number
   isVerified:boolean
}



const commAdminSchema: Schema<ICommAdmin> = new mongoose.Schema({
    role:{
        type:String,
       default:'commAdmin'
    },
    userName:{
        type:String,
        required:true
    },
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community', 
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    mobileNo:{
        type:Number,
    required:true    
    },
    isVerified:{
        type:Boolean,
        default:false
    },
}, {
    timestamps: true
});

// Hash password before saving
commAdminSchema.pre('save', async function (next) {
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
    } catch (error: any) {
        next(error);
    }
});

const CommAdmin = mongoose.model('CommAdmin', commAdminSchema);

export default CommAdmin;
