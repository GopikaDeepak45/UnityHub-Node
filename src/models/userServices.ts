// models/Service.ts
import mongoose, { Schema, model, Document } from 'mongoose';

// Define the interface for connection requests
interface ConnectionRequest {
  fromUserId: Schema.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: Date;
  respondedAt?: Date;
}

// Define the interface for the service document
export interface IService extends Document {
  serviceName: string;
  details: string;
  communityId: Schema.Types.ObjectId;
  providerId: Schema.Types.ObjectId;
  connectionRequests: ConnectionRequest[];
  connections: Schema.Types.ObjectId[];
  isApproved: boolean;
  isRejected: boolean;
  rejectionReason?: string;
  category: string;
}


const userServiceSchema = new Schema<IService>({
  serviceName: { type: String, required: true },
  details: { type: String, required: true },
  communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  connectionRequests: [
    {
      fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
      sentAt: { type: Date, default: Date.now },
      respondedAt: { type: Date },
      
    },
  ],
  connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isApproved: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false },
      rejectionReason: { type: String, default: '' },
      category: {type:String}
}, {
  timestamps: true,
});


const UserService = model<IService>('UserService', userServiceSchema);

export default UserService;
