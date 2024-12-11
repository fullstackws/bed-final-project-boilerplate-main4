import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Import the JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /hosts - Fetch all hosts, optionally filter by name
// GET /hosts - Fetch all hosts, optionally filter by name
router.get("/", async (req, res) => {
  const { name } = req.query; // Get the 'name' query parameter

  try {
    // Prepare filters
    const filters = {};

    // Apply filter by name if provided
    if (name) {
      filters.name = { contains: name, mode: "insensitive" }; // Case-insensitive search for name
    }

    const hosts = await prisma.host.findMany({
      where: filters, // Apply the filters here
      select: {
        id: true,
        username: true,
        email: true,
        aboutMe: true,
        name: true, // Make sure name is selected
      },
    });

    return res.status(200).json(hosts); // 200 OK for successful retrieval
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// POST /hosts - Create a new host
router.post("/", verifyToken, async (req, res) => {
  const { username, name, email, phoneNumber, profilePicture, aboutMe } =
    req.body;

  // Ensure that username, name, and phoneNumber are provided
  if (!username || !name || !phoneNumber) {
    return res
      .status(400)
      .json({ message: "Username, name, and phoneNumber are required" });
  }

  try {
    // Upsert operation: update if the host exists, or create a new host if it doesn't
    const newHost = await prisma.host.upsert({
      where: { username }, // Check if the username exists
      update: {
        name, // Replace with new data
        email, // Email can be non-unique
        phoneNumber, // Phone number can be non-unique
        profilePicture,
        aboutMe,
      },
      create: {
        username, // Create a new host if it doesn't exist
        name,
        email,
        phoneNumber,
        profilePicture,
        aboutMe,
      },
    });

    return res.status(201).json({
      message: "Host created or updated successfully",
      host: newHost,
    });
  } catch (err) {
    console.error("Error upserting host:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /hosts/:id - Fetch a single host by id (excluding password)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const host = await prisma.host.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        aboutMe: true,
      },
    });

    if (!host) {
      return res.status(404).json({ message: "Host not found" }); // 404 Not Found if host doesn't exist
    }

    return res.status(200).json(host); // 200 OK for successful retrieval of the host
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// PUT /hosts/:id - Update a host by id
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, aboutMe } = req.body;

  if (!username && !email && !aboutMe) {
    return res.status(400).json({
      message: "At least one field (username, email, or aboutMe) is required", // 400 Bad Request for missing fields
    });
  }

  try {
    const host = await prisma.host.findUnique({ where: { id } });

    if (!host) {
      return res.status(404).json({ message: "Host not found" }); // 404 Not Found if host doesn't exist
    }

    const updatedData = {};
    if (username) updatedData.username = username;
    if (email) updatedData.email = email;
    if (aboutMe) updatedData.aboutMe = aboutMe;

    const updatedHost = await prisma.host.update({
      where: { id },
      data: updatedData,
    });

    return res.status(200).json(updatedHost); // 200 OK for successful update
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// DELETE /hosts/:id - Delete a host by id
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the host exists before deleting
    const hostExists = await prisma.host.findUnique({ where: { id } });
    if (!hostExists) {
      return res.status(404).json({ message: "Host not found" });
    }

    // Delete all properties associated with the host
    await prisma.property.deleteMany({
      where: { hostId: id },
    });

    // Now, delete the host
    const deletedHost = await prisma.host.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Host ${deletedHost.username} and associated properties deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting host: ", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
