import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Import the JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /users - Fetch all users (without password)
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        phoneNumber: true,
        profilePicture: true,
      },
    });

    return res.status(200).json(users); // Returns all users
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /users/:id - Fetch a single user by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params; // Extract user ID from URL parameters

  try {
    const user = await prisma.user.findUnique({
      where: { id }, // Use the ID from URL to find the user
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        phoneNumber: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user); // Successfully found the user
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /users - Create a new user (no required field validation)
router.post("/", verifyToken, async (req, res) => {
  const { username, email, password, name, phoneNumber, profilePicture } =
    req.body;

  // Validate required fields
  if (!username || !email || !password || !name) {
    return res
      .status(400)
      .json({ message: "Username, email, password, and name are required" });
  }

  try {
    // Upsert operation: update if the user exists, or create a new user if it doesn't
    const newUser = await prisma.user.upsert({
      where: { username }, // Check if the username exists
      update: {
        email, // Replace with new data
        password,
        name,
        phoneNumber,
        profilePicture,
      },
      create: {
        username, // Create a new user if it doesn't exist
        email,
        password,
        name,
        phoneNumber,
        profilePicture,
      },
    });

    return res.status(201).json({
      message: "User created or updated successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("Error upserting user:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /users/:id - Update a user by ID (no required field validation)
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, name, phoneNumber, profilePicture } = req.body;

  try {
    // Check if the user exists before updating
    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user with the provided fields
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { username, email, name, phoneNumber, profilePicture },
      select: {
        username: true,
        email: true,
        name: true,
        phoneNumber: true,
        profilePicture: true,
      },
    });

    return res.status(200).json(updatedUser); // Returns the updated user
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /users/:id - Delete a user by ID
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the user exists before deleting
    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete all reviews associated with the user
    await prisma.review.deleteMany({
      where: { userId: id },
    });

    // Now, delete the user
    const deletedUser = await prisma.user.delete({ where: { id } });

    return res
      .status(200)
      .json({ message: `User ${deletedUser.username} deleted successfully` });
  } catch (err) {
    console.error(err);

    if (err.code === "P2003") {
      // Handle foreign key constraint error
      return res.status(400).json({
        message: "Unable to delete user due to foreign key constraints",
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
