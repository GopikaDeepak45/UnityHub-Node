import mongoose, { Schema, Document } from 'mongoose';
import { UserInterface } from './user';

// Define the Message Interface
interface IMessage extends Document {
  fromUserId: mongoose.Types.ObjectId | UserInterface; 
  toUserId?: mongoose.Types.ObjectId | UserInterface;   // if its a private msg
  groupId?: mongoose.Types.ObjectId    //if its a group message 
  userName: string;
  message: string;
  timestamp: Date;  
}


const MessageSchema: Schema = new Schema({
  fromUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // since optional
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: false, // since optional
  },
  userName: {  // Include userName directly for group chat convenience
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, //to sets both date and time
  },
});

// Create the Message Model
const Message = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
