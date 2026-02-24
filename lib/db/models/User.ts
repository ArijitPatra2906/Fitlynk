import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  avatar_url?: string;
  height?: number;
  date_of_birth?: Date;
  gender?: "male" | "female" | "other";
  units: "metric" | "imperial";
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    avatar_url: {
      type: String,
    },
    height: {
      type: Number,
    },
    date_of_birth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    units: {
      type: String,
      enum: ["metric", "imperial"],
      default: "metric",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes
UserSchema.index({ email: 1 });

const User = models.User || model<IUser>("User", UserSchema);

export default User;
