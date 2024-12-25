import mongoose from "mongoose";

// message.model.js
const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, 
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    audio: {
      type: String,
    },
    video: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);

export default Message;