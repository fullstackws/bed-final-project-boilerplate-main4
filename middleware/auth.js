import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  // Log the entire headers object to check if Authorization is being passed
  console.log("Request Headers: ", req.headers);

  const token = req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied" });
  }

  // Log the token for debugging
  console.log("Received Token: ", token);

  try {
    // Verify the token using the JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Log the decoded token
    console.log("Decoded Token: ", decoded);

    req.user = decoded; // Attach decoded user info to the request object
    next(); // Proceed to next middleware or route handler
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
