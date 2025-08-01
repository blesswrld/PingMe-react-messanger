import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        bio: {
            type: String,
            maxLength: 210,
            default: "",
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        profilePic: {
            type: String,
            default: "",
        },
        profileTheme: { type: String, default: "primary" },
        stats: {
            messagesSent: {
                type: Number,
                default: 0,
            },
        },
        achievements: {
            type: [String],
            default: [],
        },
        privacySettings: {
            email: {
                visibility: {
                    type: String,
                    enum: ["everyone", "contacts", "specific"],
                    default: "everyone",
                },
                allowed: [
                    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                ],
            },
            bio: {
                visibility: {
                    type: String,
                    enum: ["everyone", "contacts", "specific"],
                    default: "everyone",
                },
                allowed: [
                    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                ],
            },
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
