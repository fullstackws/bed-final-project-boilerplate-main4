import express from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// POST /login - Log in a user using JWT and return a token
router.post("/", async (req, res) => {
  const { username, password } = req.body;

  // Check if both username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    // Ensure JWT_SECRET is loaded from the environment variables
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT Secret not defined" });
    }

    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // If user not found, return an error
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the stored password (plain text comparison)
    if (password !== user.password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7h" }
    );

    // // Log the generated token for debugging (only in non-production environments)
    // if (process.env.NODE_ENV !== "production") {
    //   console.log("Generated token for user:", username);
    // }

    // Return the token in the response
    return res.status(200).json({ token });
  } catch (err) {
    console.error("Error occurred during login: ", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
