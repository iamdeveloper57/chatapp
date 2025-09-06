// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import dotenv from "dotenv";
// import cors from "cors";
// import connectDB from "./config/db.js";
// import authRoutes from "./routes/auth.js";
// import messageRoutes from "./routes/messages.js";
// import { authSocket } from "./middleware/auth.js";

// dotenv.config();
// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173", "https://pingbox.netlify.app"],
//     credentials: true,
//   },
// });

// connectDB();
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);

// // Online users map
// const onlineUsers = new Map();

// // Socket.IO middleware
// io.use(authSocket);

// io.on("connection", (socket) => {
//   if (!socket.user) {
//     console.error("⚠️ No user on socket");
//     return socket.disconnect();
//   }

//   console.log("⚡ Connected:", socket.user.id);
//   onlineUsers.set(socket.user.id, socket.id);

//   // Notify others user is online
//   io.emit("onlineUsers", [...onlineUsers.keys()]);

//   // Join personal room (like WhatsApp)
//   socket.join(socket.user.id);

//   // Private message
//   // socket.on("privateMessage", ({ to, message }) => {
//   //   const receiverSocketId = onlineUsers.get(to);
//   //   if (receiverSocketId) {
//   //     io.to(receiverSocketId).emit("privateMessage", {
//   //       from: socket.user.id,
//   //       message,
//   //     });
//   //   }
//   // });

//   // Example backend socket
//   socket.on("privateMessage", (msg) => {
//     const receiverSocketId = onlineUsers.get(msg.receiver.toString());
//     const senderSocketId = onlineUsers.get(msg.sender.toString());

//     if (receiverSocketId) io.to(receiverSocketId).emit("privateMessage", msg);
//     if (senderSocketId) io.to(senderSocketId).emit("privateMessage", msg); // make sender also receive it
//   });

//   // Initiate a call
//   socket.on("call-user", ({ to, offer }) => {
//     const receiverSocketId = onlineUsers.get(to);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("call-made", {
//         from: socket.user.id,
//         offer,
//       });
//     }
//   });

//   // Answer a call
//   socket.on("make-answer", ({ to, answer }) => {
//     const receiverSocketId = onlineUsers.get(to);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("answer-made", { answer });
//     }
//   });

//   // ICE candidates
//   socket.on("ice-candidate", ({ to, candidate }) => {
//     const receiverSocketId = onlineUsers.get(to);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("ice-candidate", { candidate });
//     }
//   });

//   // End call
//   socket.on("end-call", ({ to }) => {
//     const receiverSocketId = onlineUsers.get(to);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("end-call");
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("❌ Disconnected:", socket.user.id);
//     onlineUsers.delete(socket.user.id);
//     io.emit("onlineUsers", [...onlineUsers.keys()]);
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// export { io };


import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import { authSocket } from "./middleware/auth.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",     // Local development
  "https://pingbox.netlify.app" // Netlify deployed frontend
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

connectDB();
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Online users map
const onlineUsers = new Map();

// Socket.IO middleware
io.use(authSocket);

io.on("connection", (socket) => {
  if (!socket.user) {
    console.error("⚠️ No user on socket");
    return socket.disconnect();
  }

  console.log("⚡ Connected:", socket.user.id);
  onlineUsers.set(socket.user.id, socket.id);

  io.emit("onlineUsers", [...onlineUsers.keys()]);
  socket.join(socket.user.id);

  socket.on("privateMessage", (msg) => {
    const receiverSocketId = onlineUsers.get(msg.receiver.toString());
    const senderSocketId = onlineUsers.get(msg.sender.toString());

    if (receiverSocketId) io.to(receiverSocketId).emit("privateMessage", msg);
    if (senderSocketId) io.to(senderSocketId).emit("privateMessage", msg);
  });

  // Call events
  socket.on("call-user", ({ to, offer }) => {
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-made", { from: socket.user.id, offer });
    }
  });

  socket.on("make-answer", ({ to, answer }) => {
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("answer-made", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("end-call", ({ to }) => {
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("end-call");
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.user.id);
    onlineUsers.delete(socket.user.id);
    io.emit("onlineUsers", [...onlineUsers.keys()]);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export { io };
