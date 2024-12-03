import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Import the JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /reviews - Fetch all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      select: {
        id: true,
        rating: true,
        comment: true,
        userId: true,
        propertyId: true,
      },
    });

    return res.status(200).json(reviews); // 200 OK for successful retrieval
  } catch (err) {
    console.error("Error fetching reviews: ", err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// POST /reviews - Create a new review
router.post("/", verifyToken, async (req, res) => {
  const { rating, comment, userId, propertyId } = req.body;

  // Validate required fields
  if (!rating || !comment || !userId || !propertyId) {
    console.log("Missing required fields: ", {
      rating,
      comment,
      userId,
      propertyId,
    });
    return res.status(400).json({
      message: "Rating, comment, user ID, and property ID are required",
    });
  }

  try {
    // Check if the user exists
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the property exists
    const propertyExists = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!propertyExists) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Create the new review without specifying the id
    const newReview = await prisma.review.create({
      data: {
        // id,
        rating,
        comment,
        userId,
        propertyId,
      },
    });

    return res.status(201).json(newReview); // Return the created review
  } catch (err) {
    console.error("Error creating review: ", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /reviews/:id - Fetch a single review by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching review with ID: ${id}`);
    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        rating: true,
        comment: true,
        userId: true,
        propertyId: true,
      },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" }); // 404 Not Found if review doesn't exist
    }

    return res.status(200).json(review); // 200 OK for successful retrieval of the review
  } catch (err) {
    console.error("Error fetching review: ", err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// PUT /reviews/:id - Update a review by id
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { rating, comment, userId, propertyId } = req.body;

  if (!rating && !comment && !userId && !propertyId) {
    return res.status(400).json({
      message:
        "At least one field (rating, comment, userId, propertyId) is required", // 400 Bad Request if no fields provided
    });
  }

  try {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      return res.status(404).json({ message: "Review not found" }); // 404 Not Found if review doesn't exist
    }

    const updatedData = {};
    if (rating) updatedData.rating = rating;
    if (comment) updatedData.comment = comment;
    if (userId) updatedData.userId = userId;
    if (propertyId) updatedData.propertyId = propertyId;

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updatedData,
    });

    return res.status(200).json(updatedReview); // 200 OK for successful update
  } catch (err) {
    console.error("Error updating review: ", err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// DELETE /reviews/:id - Delete a review by id
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedReview = await prisma.review.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Review with ID ${deletedReview.id} deleted successfully`, // 200 OK for successful deletion
    });
  } catch (err) {
    console.error("Error deleting review: ", err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Review not found" }); // Handle P2025 error
    }
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

export default router;
