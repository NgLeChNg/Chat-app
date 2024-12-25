import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadMessages: {}, // New state for unread messages

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  setUnreadMessages: (userId, count) => {
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [userId]: count,
      },
    }));
  },

  incrementUnreadMessages: (userId) => {
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [userId]: (state.unreadMessages[userId] || 0) + 1,
      },
    }));
  },


  clearUnreadMessages: (userId) => {
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [userId]: 0,
      },
    }));
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();

    socket.on("newMessage", (newMessage) => {
      const messages = get().messages;
      const authUser = useAuthStore.getState().authUser;

      // Kiểm tra nếu tin nhắn đến từ người khác (không phải người dùng hiện tại)
      if (newMessage.senderId !== authUser._id) {
        if (selectedUser?._id === newMessage.senderId) {
          // Nếu đang mở chat với người gửi, thêm tin nhắn vào
          set({ messages: [...messages, newMessage] });
        } else {
          // Nếu không phải chat hiện tại, tăng số tin nhắn chưa đọc
          get().incrementUnreadMessages(newMessage.senderId);
        }
      } else {
        // Nếu là tin nhắn từ chính mình, chỉ thêm vào messages
        set({ messages: [...messages, newMessage] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));