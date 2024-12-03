import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Import the JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /properties - Fetch all properties with query parameters for filtering
router.get("/", async (req, res) => {
  const { location, pricePerNight, amenities } = req.query;

  try {
    const filters = {};

    // Filter by location (case-insensitive search)
    if (location) {
      filters.location = { contains: location, mode: "insensitive" };
    }

    // Filter by pricePerNight (exact match)
    if (pricePerNight) {
      filters.pricePerNight = { equals: parseFloat(pricePerNight) };
    }

    // Filter by amenities (multiple amenities can be provided, comma-separated)
    if (amenities) {
      const amenitiesArray = amenities.split(",");
      filters.amenities = {
        some: {
          name: { in: amenitiesArray },
        },
      };
    }

    const properties = await prisma.property.findMany({
      where: filters,
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        pricePerNight: true,
        bedroomCount: true,
        bathRoomCount: true,
        maxGuestCount: true,
        rating: true,
        hostId: true,
      },
    });

    return res.status(200).json(properties); // 200 OK for successful retrieval
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// POST /properties - Create a new property
// Apply JWT authentication middleware to this route
// Utility function to generate an ID based on the title
const generateIdFromTitle = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading and trailing hyphens
};

// POST /properties - Create a new property
router.post("/", verifyToken, async (req, res) => {
  const {
    title,
    description,
    location,
    pricePerNight,
    bedroomCount,
    bathRoomCount, // Correct spelling
    maxGuestCount,
    rating,
    hostId,
  } = req.body;

  // Derive the initial ID from the title (convert title to lowercase and replace spaces with hyphens)
  let id = title.toLowerCase().replace(/\s+/g, "-");

  try {
    // Check if the host exists before creating the property
    const hostExists = await prisma.host.findUnique({
      where: { id: hostId },
    });

    if (!hostExists) {
      return res.status(404).json({ message: "Host not found" });
    }

    // Check if the property ID already exists
    let counter = 1;
    let originalId = id;
    while (await prisma.property.findUnique({ where: { id } })) {
      // Append a number to the ID if it's already taken
      id = `${originalId}-${counter}`;
      counter++;
    }

    // Create the new property with the (possibly updated) unique ID
    const newProperty = await prisma.property.create({
      data: {
        id,
        title,
        description,
        location,
        pricePerNight,
        bedroomCount,
        bathRoomCount,
        maxGuestCount,
        rating,
        hostId,
      },
    });

    return res.status(201).json(newProperty); // 201 Created for successfully creating a new property
  } catch (err) {
    console.error("Error creating property:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /properties/:id - Fetch a single property by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        pricePerNight: true,
        bedroomCount: true,
        bathRoomCount: true,
        maxGuestCount: true,
        rating: true,
        hostId: true,
      },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" }); // 404 Not Found if property doesn't exist
    }

    return res.status(200).json(property); // 200 OK for successful retrieval of the property
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// PUT /properties/:id - Update a property by id
// Apply JWT authentication middleware to this route
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    location,
    pricePerNight,
    bedroomCount,
    bathRoomCount,
    maxGuestCount,
    rating,
    hostId,
  } = req.body;

  if (
    !title &&
    !description &&
    !location &&
    !pricePerNight &&
    !bedroomCount &&
    !bathRoomCount &&
    !maxGuestCount &&
    !rating &&
    !hostId
  ) {
    return res.status(400).json({
      message:
        "At least one field (title, description, location, pricePerNight, bedroomCount, bathRoomCount, maxGuestCount, rating, or hostId) is required", // 400 Bad Request for missing fields
    });
  }

  try {
    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
      return res.status(404).json({ message: "Property not found" }); // 404 Not Found if property doesn't exist
    }

    const updatedData = {};
    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (location) updatedData.location = location;
    if (pricePerNight) updatedData.pricePerNight = pricePerNight;
    if (bedroomCount) updatedData.bedroomCount = bedroomCount;
    if (bathRoomCount) updatedData.bathRoomCount = bathRoomCount;
    if (maxGuestCount) updatedData.maxGuestCount = maxGuestCount;
    if (rating) updatedData.rating = rating;
    if (hostId) updatedData.hostId = hostId;

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updatedData,
    });

    return res.status(200).json(updatedProperty); // 200 OK for successful update
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// DELETE /properties/:id - Delete a property by id
// Apply JWT authentication middleware to this route
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Delete related bookings first
    await prisma.booking.deleteMany({
      where: { propertyId: id },
    });

    // Now delete the property
    const deletedProperty = await prisma.property.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Property ${deletedProperty.title} deleted successfully`,
    });
  } catch (err) {
    console.error(err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Property not found" });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
