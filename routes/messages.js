// routes/messages.js
import express from "express";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Save message
router.post("/", protect, async (req, res) => {
  try {
    const { to, message } = req.body;
    const newMessage = await Message.create({
      conversationId: [req.user._id, to].sort().join("_"), // unique per user pair
      sender: req.user._id,
      receiver: to,
      text: message,
    });
    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages between two users
router.get("/:userId", protect, async (req, res) => {
  try {
    const conversationId = [req.user._id, req.params.userId].sort().join("_");
    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
