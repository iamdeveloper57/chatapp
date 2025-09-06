import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect REST API
export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Protect Socket.IO

export const authSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.error("❌ No token in socket handshake");
      return next(new Error("No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id }; // ✅ store only id
    next();
  } catch (err) {
    console.error("❌ Socket auth error:", err.message);
    next(new Error("Unauthorized"));
  }
};
