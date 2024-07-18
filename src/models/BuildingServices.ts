import mongoose, { Schema, Document, Types } from 'mongoose';


interface ScheduledService {
  scheduledTime: number;
  scheduledBy: Types.ObjectId; 
  scheduledDate: Date; 
  
}

export interface BuildingServiceInterface extends Document {
  name: string;
  description: string;
  communityId: Schema.Types.ObjectId; 
  scheduledTimes: ScheduledService[];
  maxServicesPerHour: number; 
}

const buildingServiceSchema = new Schema<BuildingServiceInterface>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  communityId: {
    type: Schema.Types.ObjectId,
    ref: 'Community', 
    required: true,
  },
  scheduledTimes: {
    type: [{
      scheduledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
      },
       scheduledDate: {
        type: Date,
        required: true,
      },
      scheduledTime: {
        type: Number,
        required: true,
      },
    }],
    default: [],
  },
  maxServicesPerHour: {
    type: Number,
    default: 1, // Default to 1 service per hour if not specified
  },
});

const BuildingService = mongoose.model<BuildingServiceInterface>('BuildingService', buildingServiceSchema);

export default BuildingService;
