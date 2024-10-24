
// import mongoose from 'mongoose';
// import Message from '../models/message';

// // The fn to save the chat message
// export async function saveMessage(
//   fromUserId: mongoose.Types.ObjectId,
//   toUserId: mongoose.Types.ObjectId,
//   messageText: string
// ) {
//   const newMessage = new Message({
//     fromUserId,
//     toUserId,
//     message: messageText,
//     timestamp: new Date(), 
//   });
  
//   await newMessage.save();
//   console.log('Message saved!');
// }
import mongoose from 'mongoose';
import Message from '../models/message';
import User from '../models/user';
import { NotFoundError } from '../errors/NotFoundError';


export async function saveMessage(
  fromUserId: mongoose.Types.ObjectId,
  toUserIdOrGroupId: mongoose.Types.ObjectId,
  messageText: string,
  isGroupMessage: boolean = false // default false so for private chat msg no need for 4th parameter
) {
  const user = await User.findById(fromUserId).select('userName');
if(!user){
  throw new NotFoundError('user not found')
}
  const newMessage = new Message({
    fromUserId,
    userName: user.userName,
    message: messageText,
    timestamp: new Date(),
  });

  
  if (isGroupMessage) {
    newMessage.groupId = toUserIdOrGroupId; // Save groupId for group messages
  } else {
    newMessage.toUserId = toUserIdOrGroupId; // Save toUserId for private messages
  }

  // Save the message to the database
  await newMessage.save();
  console.log('Message saved!');
}
