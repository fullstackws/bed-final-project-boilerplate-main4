import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Assuming you have JWT-based auth

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

// GET /users/:id - Fetch a single user by ID (without password)
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

// POST /users - Create a new user
router.post("/", verifyToken, async (req, res) => {
  const { username, email, password, name, phoneNumber, profilePicture } =
    req.body;

  // Validate required fields
  // if (!username || !email || !password || !name) {
  //   return res
  //     .status(400)
  //     .json({ message: "Username, email, password, and name are required" });
  // }

  try {
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already taken" });
    }

    // Create the new user
    const newUser = await prisma.user.create({
      data: { username, email, password, name, phoneNumber, profilePicture },
      // select: { username: true, email: true, name: true },
    });

    return res.status(201).json(newUser); // Returns the created user
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /users/:id - Update a user by ID
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, name, phoneNumber, profilePicture } = req.body;

  if (!username && !email && !name && !phoneNumber && !profilePicture) {
    return res
      .status(400)
      .json({ message: "At least one field is required for update" });
  }

  try {
    // Check if the user exists before updating
    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profilePicture) updateData.profilePicture = profilePicture;

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        // id: true,
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

    const deletedUser = await prisma.user.delete({ where: { id } });
    return res
      .status(200)
      .json({ message: `User ${deletedUser.username} deleted successfully` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
