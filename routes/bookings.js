import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Import the JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /bookings - Fetch all bookings or filter by userId
router.get("/", async (req, res) => {
  const { userId } = req.query; // Get userId from query parameters

  try {
    const filters = {};

    // Apply userId filter if provided
    if (userId) {
      filters.userId = userId; // Filter bookings by userId
    }

    // Log the filters to see if they are correct
    console.log("Filters: ", filters);

    const bookings = await prisma.booking.findMany({
      where: filters,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        userId: true,
        propertyId: true,
      },
    });

    // Log the bookings to see if they are fetched
    console.log("Bookings: ", bookings);

    return res.status(200).json(bookings); // Return the bookings as an array
  } catch (err) {
    console.error("Error fetching bookings: ", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /bookings - Create a new booking
router.post("/", verifyToken, async (req, res) => {
  const {
    numberOfGuests,
    checkinDate,
    checkoutDate,
    userId,
    propertyId,
    totalPrice,
    bookingStatus,
  } = req.body;

  // Validate dates
  const startDate = new Date(checkinDate);
  const endDate = new Date(checkoutDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      message:
        "Invalid checkinDate or checkoutDate. Please provide valid dates.",
    });
  }

  // Validate required fields
  if (!userId || !propertyId) {
    return res.status(400).json({
      message: "userId and propertyId are required.",
    });
  }

  // Validate numberOfGuests (must be a positive integer or set a default value)
  if (numberOfGuests && (isNaN(numberOfGuests) || numberOfGuests <= 0)) {
    return res.status(400).json({
      message: "numberOfGuests must be a positive integer.",
    });
  }

  try {
    // Check if the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userExists) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the property exists
    const propertyExists = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!propertyExists) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Create the booking
    const newBooking = await prisma.booking.create({
      data: {
        startDate,
        endDate,
        userId,
        propertyId,
        numberOfGuests: numberOfGuests || 1, // Default to 1 if numberOfGuests is not provided
        totalPrice,
        bookingStatus,
      },
    });

    return res.status(201).json(newBooking); // Return the newly created booking
  } catch (err) {
    console.error("Error creating booking: ", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /bookings/:id - Fetch a single booking by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching booking with ID: ${id}`); // Log the incoming request

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        userId: true,
        propertyId: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" }); // 404 Not Found if booking doesn't exist
    }

    return res.status(200).json(booking); // 200 OK for successful retrieval of the booking
  } catch (err) {
    console.error("Error fetching booking: ", err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// PUT /bookings/:id - Update a booking by id
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const {
    checkinDate,
    checkoutDate,
    numberOfGuests,
    totalPrice,
    bookingStatus,
    userId,
    propertyId,
  } = req.body;

  // Ensure that at least one field is provided for the update
  if (
    !checkinDate &&
    !checkoutDate &&
    !numberOfGuests &&
    !totalPrice &&
    !bookingStatus &&
    !userId &&
    !propertyId
  ) {
    return res.status(400).json({
      message:
        "At least one field (checkinDate, checkoutDate, numberOfGuests, totalPrice, bookingStatus, userId, propertyId) is required", // 400 Bad Request if no fields provided
    });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" }); // 404 Not Found if booking doesn't exist
    }

    const updatedData = {};

    // Update the fields if provided
    if (checkinDate) updatedData.startDate = new Date(checkinDate);
    if (checkoutDate) updatedData.endDate = new Date(checkoutDate);
    if (numberOfGuests) updatedData.numberOfGuests = numberOfGuests;
    if (totalPrice) updatedData.totalPrice = totalPrice;
    if (bookingStatus) updatedData.bookingStatus = bookingStatus;
    if (userId) updatedData.userId = userId;
    if (propertyId) updatedData.propertyId = propertyId;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updatedData,
    });

    return res.status(200).json(updatedBooking); // 200 OK for successful update
  } catch (err) {
    console.error("Error updating booking: ", err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// DELETE /bookings/:id - Delete a booking by id
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the booking exists before attempting to delete
    const bookingExists = await prisma.booking.findUnique({
      where: { id },
    });

    if (!bookingExists) {
      return res.status(404).json({ message: "Booking not found" }); // Return 404 if booking is not found
    }

    // Proceed to delete the booking
    const deletedBooking = await prisma.booking.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Booking ${deletedBooking.id} deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting booking: ", err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Booking not found" }); // Handle P2025 error
    }
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
