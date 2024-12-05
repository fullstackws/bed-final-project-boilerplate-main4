// Import Sentry instrumentation for ESM
import "../instrument.js"; // Ensure the instrument.js file exists and is properly set up

import express from "express";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node"; // Import Sentry for ESM
import loginRoute from "../routes/login.js";
import usersRoute from "../routes/users.js";
import hostsRoute from "../routes/hosts.js";
import propertiesRoute from "../routes/properties.js";
import amenitiesRoute from "../routes/amenities.js";
import bookingsRoute from "../routes/bookings.js";
import reviewsRoute from "../routes/reviews.js";
import { logRequestDuration } from "../middleware/loggingMiddleware.js";
import helmet from "helmet";
import logger from "../config/logger.js"; // Ensure the path is correct
import path from "path";
import { fileURLToPath } from "url";

// Ensure proper ESM handling of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN, // Use your actual Sentry DSN here
  environment: process.env.NODE_ENV || "development",
});

// Body parser middleware to handle JSON requests
app.use(express.json()); // This is important for parsing the request body

// Logging middleware to log request durations and details
app.use(logRequestDuration);

// Your existing routes
app.use("/login", loginRoute);
app.use("/users", usersRoute);
app.use("/hosts", hostsRoute);
app.use("/properties", propertiesRoute);
app.use("/amenities", amenitiesRoute);
app.use("/bookings", bookingsRoute);
app.use("/reviews", reviewsRoute);

// Optional: Debug route to trigger a test error in Sentry
// app.get("/debug-sentry", function mainHandler(req, res) {
//   throw new Error("My first Sentry error!");
// });

// Sentry middleware to track errors and performance (should be after routes)
Sentry.setupExpressErrorHandler(app);

// Error handling middleware (catch-all)
app.use((err, req, res, next) => {
  logger.error(`Error occurred: ${err.message}`);

  if (err.status === 404) {
    return res.status(404).json({ message: "Resource not found" });
  }

  if (err.status === 400) {
    return res.status(400).json({ message: "Bad request" });
  }

  // Default 500 Internal Server Error response
  return res.status(500).json({
    message:
      "An error occurred on the server, please double-check your request!",
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

export default app;
