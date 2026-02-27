import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import connectDB from "../db/mongodb";
import User from "../db/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign(
    { id: userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET as string);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

// Get user from request (middleware helper)
export async function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    await connectDB();
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw error;
  }
}

// Error response helper
export function errorResponse(message: string, status: number = 400) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

// Success response helper
export function successResponse(data: any, status: number = 200) {
  return Response.json(
    {
      success: true,
      data,
    },
    { status }
  );
}
