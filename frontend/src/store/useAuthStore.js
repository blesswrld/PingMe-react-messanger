import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:5001";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isUpdatingBio: false,
    isUpdatingUsername: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({ authUser: res.data });
            get().connectSocket();
        } catch (error) {
            console.log("Error in CheckAuth:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data });
            toast.success("Account created successfully");
            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");

            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    updateProfilePic: async (profilePic) => {
        set({ isUpdatingProfilePic: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", {
                profilePic,
            });

            set({ authUser: res.data });
            toast.success("Avatar updated successfully");
        } catch (error) {
            console.log("Error in update profile:", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isUpdatingProfilePic: false });
        }
    },
    updateBio: async (bio) => {
        set({ isUpdatingBio: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", {
                bio,
            });
            set({ authUser: res.data });
            toast.success("Bio updated successfully");
        } catch (error) {
            console.log("Failed to update bio:", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isUpdatingBio: false });
        }
    },
    updateUsername: async (fullName) => {
        set({ isUpdatingUsername: true });
        const previousAuthUser = get().authUser;
        try {
            const res = await axiosInstance.put("/auth/update-profile", {
                fullName,
            });

            console.log(
                "<<< Backend response for username update:",
                JSON.stringify(res.data)
            );
            console.log(
                `>>> Updating authUser in store. Old name: "${previousAuthUser?.fullName}", New name from response: "${res.data?.fullName}"`
            );

            set({ authUser: res.data });

            toast.success("Username updated successfully");
        } catch (error) {
            console.error("Error updating username:", error);
            toast.error(
                error.response?.data?.message || "Failed to update username"
            );
        } finally {
            set({ isUpdatingUsername: false });
        }
    },
    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        });
        socket.connect();

        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds });
        });
    },
    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    },
}));
