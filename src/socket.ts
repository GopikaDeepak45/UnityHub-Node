import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import mongoose from "mongoose";
import { saveMessage } from "./controllers/messageController";

export const setupSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173"], 
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // join room for the priivate chat with fromUserId and toUserId
    socket.on("join_room", ({ fromUserId, toUserId }) => {
      const room = [fromUserId, toUserId].sort().join("_"); // Unique room ID for both users, sort is to maintain the order, so no problem
      socket.join(room);
      console.log(`User ${fromUserId} joined room ${room}`);
    });

    // for the group chats with groupid
    socket.on('join_group', (groupId) => {
      socket.join(groupId);
      console.log(`User joined group ${groupId}`);
    });

    // Handle 'send_message' event: Send message to a specific room, so our private chats
    socket.on(
      "send_message",
      async (data: {
        fromUserId: string;
        toUserId: string;
        message: string;
      }) => {
        const fromUserId = new mongoose.Types.ObjectId(data.fromUserId);
        const toUserId = new mongoose.Types.ObjectId(data.toUserId);
        const messageText = data.message;

        // Save the message in the database
        await saveMessage(fromUserId, toUserId, messageText);

        // Generate the unique room ID
        const room = [data.fromUserId, data.toUserId].sort().join("_");

        // Send the message only to users in the room
        io.to(room).emit("receive_message", data);
      }
    );

// Handle sending messages to group chat
socket.on('send_group_message', async (data: { groupId: string; fromUserId: string;userName:string; message: string }) => {

  const fromUserId = new mongoose.Types.ObjectId(data.fromUserId);
  const groupId = new mongoose.Types.ObjectId(data.groupId);
  // Save the message for group chat (optional depending on your data model)
  await saveMessage(fromUserId, groupId, data.message, true); // Save group message (modify to fit your logic)

  const messagePayload = {
    fromUserId: data.fromUserId,
    userName: data.userName,  // Include username
    groupId: data.groupId,
    message: data.message,
    timestamp: new Date(), // Send timestamp along with the message
  };

  // Emit the message to all users in the group room with full data
  io.to(data.groupId).emit('receive_group_message', messagePayload);
});

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
